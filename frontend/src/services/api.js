/**
 * API Service for Browser Automation Backend
 */

// Dynamic API URL based on environment
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser environment
    const { protocol, hostname, port } = window.location;
    
    // If we're on localhost, use the development port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    
    // For production, use the same origin
    return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:3001/api';
};

class ApiService {
  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  // Helper method for making HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Create a new recording
  async createRecording(interactions, metadata = {}) {
    return this.request('/recordings', {
      method: 'POST',
      body: JSON.stringify({
        interactions,
        metadata: {
          ...metadata,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      })
    });
  }

  // Get a specific recording by ID
  async getRecording(id) {
    return this.request(`/recordings/${id}`);
  }

  // Get all recordings
  async getAllRecordings() {
    return this.request('/recordings');
  }

  // Poll for recording status updates
  async pollRecordingStatus(id, onUpdate, maxAttempts = 30) {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const recording = await this.getRecording(id);
        onUpdate(recording);
        
        if (recording.status === 'completed' || recording.status === 'error') {
          return recording;
        }
        
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          throw new Error('Polling timeout: Recording took too long to process');
        }
      } catch (error) {
        console.error('Polling error:', error);
        onUpdate({ status: 'error', error: error.message });
      }
    };
    
    poll();
  }

  // Check backend health
  async checkHealth() {
    try {
      const healthUrl = this.baseUrl.replace('/api', '/health');
      const response = await fetch(healthUrl);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
