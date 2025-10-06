/**
 * API Registry Service
 * Manages the lifecycle of generated APIs, stores them for retrieval, and provides testing capabilities
 */
const fs = require('fs').promises;
const path = require('path');

class APIRegistry {
  constructor() {
    this.registryPath = path.join(__dirname, '../data/api-registry.json');
    this.apisPath = path.join(__dirname, '../data/apis');
    this.registry = new Map();
    this.initializeRegistry();
  }

  async initializeRegistry() {
    try {
      // Ensure data directories exist
      await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
      await fs.mkdir(this.apisPath, { recursive: true });

      // Load existing registry
      try {
        const registryData = await fs.readFile(this.registryPath, 'utf8');
        const registryArray = JSON.parse(registryData);
        this.registry = new Map(registryArray.map(api => [api.id, api]));
        console.log(`Loaded ${this.registry.size} APIs from registry`);
      } catch (error) {
        console.log('No existing registry found, starting fresh');
        await this.saveRegistry();
      }
    } catch (error) {
      console.error('Failed to initialize API registry:', error);
    }
  }

  async saveRegistry() {
    try {
      const registryArray = Array.from(this.registry.values());
      await fs.writeFile(this.registryPath, JSON.stringify(registryArray, null, 2));
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  }

  /**
   * Register a new API from a recording
   */
  async registerAPI(recording, automationPackage, apiPackage) {
    const apiId = `api_${recording.id}`;
    const timestamp = new Date().toISOString();
    
    const apiEntry = {
      id: apiId,
      recordingId: recording.id,
      name: apiPackage.metadata.name,
      title: recording.metadata?.title || `Automation API ${recording.id.slice(0, 8)}`,
      description: apiPackage.metadata.description,
      version: apiPackage.metadata.version,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {
        ...apiPackage.metadata,
        originalUrl: recording.metadata?.url,
        interactionCount: recording.interactions?.length || 0,
        complexity: automationPackage.analysis?.complexity || 'medium'
      },
      endpoints: this.generateEndpoints(apiId, apiPackage.metadata),
      openApiSpec: apiPackage.apis.openapi,
      implementations: {
        express: apiPackage.apis.express,
        fastapi: apiPackage.apis.fastapi,
        flask: apiPackage.apis.flask
      },
      deployment: apiPackage.deployment,
      examples: apiPackage.examples,
      documentation: apiPackage.documentation,
      stats: {
        calls: 0,
        lastCalled: null,
        errors: 0,
        avgResponseTime: 0
      }
    };

    // Save API files
    await this.saveAPIFiles(apiId, apiEntry);
    
    // Register in memory and persist
    this.registry.set(apiId, apiEntry);
    await this.saveRegistry();

    console.log(`Registered new API: ${apiId} - ${apiEntry.name}`);
    return apiEntry;
  }

  async saveAPIFiles(apiId, apiEntry) {
    const apiDir = path.join(this.apisPath, apiId);
    await fs.mkdir(apiDir, { recursive: true });

    // Save OpenAPI spec
    await fs.writeFile(
      path.join(apiDir, 'openapi.json'),
      JSON.stringify(apiEntry.openApiSpec, null, 2)
    );

    // Save implementations
    await fs.writeFile(
      path.join(apiDir, 'express.js'),
      apiEntry.implementations.express
    );

    await fs.writeFile(
      path.join(apiDir, 'fastapi.py'),
      apiEntry.implementations.fastapi
    );

    await fs.writeFile(
      path.join(apiDir, 'flask.py'),
      apiEntry.implementations.flask
    );

    // Save documentation
    await fs.writeFile(
      path.join(apiDir, 'README.md'),
      apiEntry.documentation
    );
  }

  generateEndpoints(apiId, metadata) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    
    return [
      {
        path: `/api/live/${apiId}/execute`,
        method: 'POST',
        description: 'Execute the automation',
        url: `${baseUrl}/api/live/${apiId}/execute`
      },
      {
        path: `/api/live/${apiId}/status`,
        method: 'GET',
        description: 'Get API status and statistics',
        url: `${baseUrl}/api/live/${apiId}/status`
      },
      {
        path: `/api/live/${apiId}/docs`,
        method: 'GET',
        description: 'Get API documentation',
        url: `${baseUrl}/api/live/${apiId}/docs`
      },
      {
        path: `/api/live/${apiId}/openapi`,
        method: 'GET',
        description: 'Get OpenAPI specification',
        url: `${baseUrl}/api/live/${apiId}/openapi`
      }
    ];
  }

  /**
   * Get all registered APIs
   */
  getAllAPIs() {
    return Array.from(this.registry.values()).map(api => ({
      id: api.id,
      name: api.name,
      title: api.title,
      description: api.description,
      version: api.version,
      status: api.status,
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
      metadata: api.metadata,
      endpoints: api.endpoints,
      stats: api.stats
    }));
  }

  /**
   * Get specific API by ID
   */
  getAPI(apiId) {
    return this.registry.get(apiId);
  }

  /**
   * Get API by recording ID
   */
  getAPIByRecording(recordingId) {
    return Array.from(this.registry.values()).find(api => api.recordingId === recordingId);
  }

  /**
   * Update API statistics
   */
  async updateAPIStats(apiId, stats) {
    const api = this.registry.get(apiId);
    if (api) {
      api.stats = { ...api.stats, ...stats };
      api.updatedAt = new Date().toISOString();
      await this.saveRegistry();
    }
  }

  /**
   * Execute API call (proxy to actual automation)
   */
  async executeAPI(apiId, parameters) {
    const api = this.registry.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const startTime = Date.now();
    
    try {
      // Get the original recording to execute
      const recording = global.recordings?.get(api.recordingId);
      if (!recording || !recording.automationPackage) {
        throw new Error('Original recording not available for execution');
      }

      // Execute the automation (simplified version)
      const result = await this.executeAutomation(recording, parameters);
      
      const responseTime = Date.now() - startTime;
      
      // Update statistics
      await this.updateAPIStats(apiId, {
        calls: api.stats.calls + 1,
        lastCalled: new Date().toISOString(),
        avgResponseTime: Math.round((api.stats.avgResponseTime * api.stats.calls + responseTime) / (api.stats.calls + 1))
      });

      return {
        success: true,
        result,
        executionTime: responseTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      await this.updateAPIStats(apiId, {
        errors: api.stats.errors + 1
      });

      throw error;
    }
  }

  async executeAutomation(recording, parameters) {
    // This is a simplified execution - in a real implementation,
    // you would run the actual browser automation
    return {
      message: 'Automation executed successfully',
      parameters,
      interactions: recording.interactions?.length || 0,
      url: recording.metadata?.url,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate Swagger UI HTML for an API
   */
  generateSwaggerUI(apiId) {
    const api = this.registry.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${api.name} - API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .custom-header {
            background: #1f2937;
            color: white;
            padding: 1rem;
            text-align: center;
        }
        .custom-header h1 {
            margin: 0;
            font-size: 1.5rem;
        }
        .custom-header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>${api.name}</h1>
        <p>${api.description}</p>
        <p>Generated from browser automation • Version ${api.version}</p>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/live/${apiId}/openapi',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    request.headers['Content-Type'] = 'application/json';
                    return request;
                }
            });
        };
    </script>
</body>
</html>`;
  }

  /**
   * Delete an API
   */
  async deleteAPI(apiId) {
    const api = this.registry.get(apiId);
    if (api) {
      // Remove from registry
      this.registry.delete(apiId);
      await this.saveRegistry();

      // Remove API files
      try {
        const apiDir = path.join(this.apisPath, apiId);
        await fs.rmdir(apiDir, { recursive: true });
      } catch (error) {
        console.error(`Failed to remove API files for ${apiId}:`, error);
      }

      console.log(`Deleted API: ${apiId}`);
      return true;
    }
    return false;
  }

  /**
   * Get API statistics summary
   */
  getRegistryStats() {
    const apis = Array.from(this.registry.values());
    
    return {
      totalAPIs: apis.length,
      activeAPIs: apis.filter(api => api.status === 'active').length,
      totalCalls: apis.reduce((sum, api) => sum + api.stats.calls, 0),
      totalErrors: apis.reduce((sum, api) => sum + api.stats.errors, 0),
      avgResponseTime: apis.length > 0 
        ? Math.round(apis.reduce((sum, api) => sum + api.stats.avgResponseTime, 0) / apis.length)
        : 0,
      recentAPIs: apis
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(api => ({
          id: api.id,
          name: api.name,
          createdAt: api.createdAt,
          calls: api.stats.calls
        }))
    };
  }
}

module.exports = APIRegistry;
