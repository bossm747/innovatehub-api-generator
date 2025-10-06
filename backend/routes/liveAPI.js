/**
 * Live API Routes
 * Handles live API execution, testing, and Swagger documentation
 */
const express = require('express');
const router = express.Router();

// Database service will be accessed via global.db

/**
 * Get all registered APIs
 */
router.get('/apis', async (req, res) => {
  try {
    if (!global.db || !global.db.isHealthy()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available'
      });
    }

    const apis = await global.db.getAllAPIs();
    res.json({
      success: true,
      data: apis,
      count: apis.length
    });
  } catch (error) {
    console.error('Error fetching APIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch APIs'
    });
  }
});

/**
 * Get specific API details
 */
router.get('/apis/:apiId', async (req, res) => {
  try {
    const { apiId } = req.params;
    const api = apiRegistry.getAPI(apiId);
    
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    res.json({
      success: true,
      data: api
    });
  } catch (error) {
    console.error('Error fetching API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API'
    });
  }
});

/**
 * Execute a live API
 */
router.post('/apis/:apiId/execute', async (req, res) => {
  try {
    const { apiId } = req.params;
    const parameters = req.body;

    const result = await apiRegistry.executeAPI(apiId, parameters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute API'
    });
  }
});

/**
 * Get API status and statistics
 */
router.get('/apis/:apiId/status', async (req, res) => {
  try {
    const { apiId } = req.params;
    const api = apiRegistry.getAPI(apiId);
    
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: api.id,
        name: api.name,
        status: api.status,
        version: api.version,
        stats: api.stats,
        endpoints: api.endpoints,
        lastUpdated: api.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching API status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API status'
    });
  }
});

/**
 * Get OpenAPI specification for an API
 */
router.get('/apis/:apiId/openapi', async (req, res) => {
  try {
    const { apiId } = req.params;
    const api = apiRegistry.getAPI(apiId);
    
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    // Enhance OpenAPI spec with live server information
    const openApiSpec = {
      ...api.openApiSpec,
      servers: [
        {
          url: `${req.protocol}://${req.get('host')}/api/live/apis/${apiId}`,
          description: 'Live API Server'
        }
      ]
    };

    res.json(openApiSpec);
  } catch (error) {
    console.error('Error fetching OpenAPI spec:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch OpenAPI specification'
    });
  }
});

/**
 * Get API documentation
 */
router.get('/apis/:apiId/docs', async (req, res) => {
  try {
    const { apiId } = req.params;
    const api = apiRegistry.getAPI(apiId);
    
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    res.type('text/markdown').send(api.documentation);
  } catch (error) {
    console.error('Error fetching API docs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API documentation'
    });
  }
});

/**
 * Get Swagger UI for an API
 */
router.get('/apis/:apiId/swagger', async (req, res) => {
  try {
    const { apiId } = req.params;
    const swaggerHTML = apiRegistry.generateSwaggerUI(apiId);
    res.type('text/html').send(swaggerHTML);
  } catch (error) {
    console.error('Error generating Swagger UI:', error);
    res.status(404).send(`
      <html>
        <body>
          <h1>API Not Found</h1>
          <p>The requested API documentation could not be found.</p>
          <a href="/api/live/apis">← Back to API List</a>
        </body>
      </html>
    `);
  }
});

/**
 * Delete an API
 */
router.delete('/apis/:apiId', async (req, res) => {
  try {
    const { apiId } = req.params;
    const deleted = await apiRegistry.deleteAPI(apiId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    res.json({
      success: true,
      message: 'API deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete API'
    });
  }
});

/**
 * Get registry statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = apiRegistry.getRegistryStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching registry stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registry statistics'
    });
  }
});

/**
 * API Registry Dashboard (HTML)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const apis = apiRegistry.getAllAPIs();
    const stats = apiRegistry.getRegistryStats();
    
    const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Registry Dashboard - Innovatehub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-cogs text-2xl text-blue-600"></i>
                        <h1 class="text-2xl font-bold text-gray-900">API Registry Dashboard</h1>
                    </div>
                    <div class="text-sm text-gray-500">
                        Innovatehub API Generator
                    </div>
                </div>
            </div>
        </header>

        <!-- Stats Overview -->
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <i class="fas fa-api text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total APIs</p>
                            <p class="text-2xl font-semibold text-gray-900">${stats.totalAPIs}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <i class="fas fa-check-circle text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Active APIs</p>
                            <p class="text-2xl font-semibold text-gray-900">${stats.activeAPIs}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <i class="fas fa-chart-line text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total Calls</p>
                            <p class="text-2xl font-semibold text-gray-900">${stats.totalCalls}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-yellow-100 rounded-lg">
                            <i class="fas fa-clock text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Avg Response</p>
                            <p class="text-2xl font-semibold text-gray-900">${stats.avgResponseTime}ms</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- APIs List -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">Registered APIs</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${apis.map(api => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">${api.name}</div>
                                            <div class="text-sm text-gray-500">${api.description}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${api.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                            ${api.status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${api.stats.calls}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${new Date(api.createdAt).toLocaleDateString()}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href="/api/live/apis/${api.id}/swagger" target="_blank" class="text-blue-600 hover:text-blue-900 mr-3">
                                            <i class="fas fa-external-link-alt"></i> Test
                                        </a>
                                        <a href="/api/live/apis/${api.id}/docs" target="_blank" class="text-green-600 hover:text-green-900">
                                            <i class="fas fa-book"></i> Docs
                                        </a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    res.type('text/html').send(dashboardHTML);
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).send('Error generating dashboard');
  }
});

// Export the router
// Note: apiRegistry is now handled by the database service

module.exports = router;
