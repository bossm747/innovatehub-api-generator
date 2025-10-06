/**
 * Database Service
 * Handles PostgreSQL database operations using Neon
 */
const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      const connectionString = process.env.DATABASE_URL || 
        'postgresql://neondb_owner:npg_08eaQdWqkRTn@ep-solitary-salad-afenjx64-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
      
      this.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get database connection status
   */
  isHealthy() {
    return this.isConnected && this.pool;
  }

  /**
   * Execute a query
   */
  async query(text, params = []) {
    if (!this.isHealthy()) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    if (!this.isHealthy()) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Recording operations
   */
  async createRecording(data) {
    const { title, description, interactions, metadata } = data;
    
    const query = `
      INSERT INTO recordings (title, description, interactions, metadata, status)
      VALUES ($1, $2, $3, $4, 'processing')
      RETURNING *
    `;
    
    const result = await this.query(query, [
      title,
      description,
      JSON.stringify(interactions),
      JSON.stringify(metadata || {})
    ]);
    
    return result.rows[0];
  }

  async getRecording(id) {
    const query = 'SELECT * FROM recordings WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async getAllRecordings() {
    const query = `
      SELECT id, title, description, status, created_at, updated_at, completed_at,
             jsonb_array_length(interactions) as interaction_count
      FROM recordings 
      ORDER BY created_at DESC
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async updateRecording(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        paramIndex++;
      }
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE recordings 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * API Registry operations
   */
  async createAPI(data) {
    const { recording_id, name, description, version, endpoints, openapi_spec } = data;
    
    const query = `
      INSERT INTO api_registry (recording_id, name, description, version, endpoints, openapi_spec, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;
    
    const result = await this.query(query, [
      recording_id,
      name,
      description,
      version || '1.0.0',
      JSON.stringify(endpoints || []),
      JSON.stringify(openapi_spec || {})
    ]);
    
    return result.rows[0];
  }

  async getAllAPIs() {
    const query = `
      SELECT ar.*, r.title as recording_title
      FROM api_registry ar
      LEFT JOIN recordings r ON ar.recording_id = r.id
      ORDER BY ar.created_at DESC
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async getAPI(id) {
    const query = `
      SELECT ar.*, r.title as recording_title, r.interactions
      FROM api_registry ar
      LEFT JOIN recordings r ON ar.recording_id = r.id
      WHERE ar.id = $1
    `;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async updateAPIStats(id, stats) {
    const query = `
      UPDATE api_registry 
      SET stats = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await this.query(query, [JSON.stringify(stats), id]);
    return result.rows[0];
  }

  async deleteAPI(id) {
    const query = 'DELETE FROM api_registry WHERE id = $1 RETURNING *';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Settings operations
   */
  async getSetting(key) {
    const query = 'SELECT value FROM settings WHERE key = $1';
    const result = await this.query(query, [key]);
    return result.rows[0]?.value;
  }

  async getAllSettings() {
    const query = 'SELECT key, value FROM settings';
    const result = await this.query(query);
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings;
  }

  async setSetting(key, value) {
    const query = `
      INSERT INTO settings (key, value) 
      VALUES ($1, $2)
      ON CONFLICT (key) 
      DO UPDATE SET value = $2, updated_at = NOW()
      RETURNING *
    `;
    
    const result = await this.query(query, [key, JSON.stringify(value)]);
    return result.rows[0];
  }

  async setMultipleSettings(settings) {
    return await this.transaction(async (client) => {
      const results = [];
      
      for (const [key, value] of Object.entries(settings)) {
        const query = `
          INSERT INTO settings (key, value) 
          VALUES ($1, $2)
          ON CONFLICT (key) 
          DO UPDATE SET value = $2, updated_at = NOW()
          RETURNING *
        `;
        
        const result = await client.query(query, [key, JSON.stringify(value)]);
        results.push(result.rows[0]);
      }
      
      return results;
    });
  }

  /**
   * API Calls logging
   */
  async logAPICall(data) {
    const { api_id, endpoint, method, request_data, response_data, status_code, response_time, error_message } = data;
    
    const query = `
      INSERT INTO api_calls (api_id, endpoint, method, request_data, response_data, status_code, response_time, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      api_id,
      endpoint,
      method,
      JSON.stringify(request_data),
      JSON.stringify(response_data),
      status_code,
      response_time,
      error_message
    ]);
    
    return result.rows[0];
  }

  async getAPICallStats(api_id) {
    const query = `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errors,
        AVG(response_time) as avg_response_time,
        MAX(created_at) as last_call
      FROM api_calls 
      WHERE api_id = $1
    `;
    
    const result = await this.query(query, [api_id]);
    return result.rows[0];
  }

  async getGlobalStats() {
    const queries = await Promise.all([
      this.query('SELECT COUNT(*) as total_apis FROM api_registry WHERE status = $1', ['active']),
      this.query('SELECT COUNT(*) as total_recordings FROM recordings'),
      this.query('SELECT COUNT(*) as total_calls FROM api_calls'),
      this.query('SELECT AVG(response_time) as avg_response_time FROM api_calls WHERE response_time IS NOT NULL')
    ]);

    return {
      totalAPIs: parseInt(queries[0].rows[0].total_apis),
      activeAPIs: parseInt(queries[0].rows[0].total_apis),
      totalRecordings: parseInt(queries[1].rows[0].total_recordings),
      totalCalls: parseInt(queries[2].rows[0].total_calls),
      avgResponseTime: Math.round(parseFloat(queries[3].rows[0].avg_response_time) || 0)
    };
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('Database connection closed');
    }
  }
}

module.exports = DatabaseService;
