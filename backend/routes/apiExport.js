const express = require('express');
const APIExportService = require('../services/apiExportService');

const router = express.Router();
const apiExportService = new APIExportService();

/**
 * Generate API package for a recording
 */
router.post('/recordings/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'all' } = req.body;
    
    // Get recording from storage (in production, this would be from database)
    const recording = global.recordings?.get(id);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    if (!recording.automationPackage) {
      return res.status(400).json({ error: 'Recording has not been processed yet' });
    }
    
    // Generate API package
    const apiPackage = await apiExportService.generateAPIPackage(recording, recording.automationPackage);
    
    // Filter by requested format
    if (format !== 'all' && apiPackage.apis[format]) {
      return res.json({
        format,
        code: apiPackage.apis[format],
        metadata: apiPackage.metadata,
        documentation: apiPackage.documentation
      });
    }
    
    res.json(apiPackage);
    
  } catch (error) {
    console.error('Error exporting API:', error);
    res.status(500).json({ error: 'Failed to export API' });
  }
});

/**
 * Download API code as file
 */
router.get('/recordings/:id/download/:format', async (req, res) => {
  try {
    const { id, format } = req.params;
    
    // Get recording from storage
    const recording = global.recordings?.get(id);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    if (!recording.automationPackage) {
      return res.status(400).json({ error: 'Recording has not been processed yet' });
    }
    
    // Generate API package
    const apiPackage = await apiExportService.generateAPIPackage(recording, recording.automationPackage);
    
    if (!apiPackage.apis[format]) {
      return res.status(400).json({ error: `Format '${format}' not supported` });
    }
    
    // Set appropriate headers for file download
    const extensions = {
      express: 'js',
      fastapi: 'py',
      flask: 'py',
      openapi: 'json'
    };
    
    const extension = extensions[format] || 'txt';
    const filename = `${apiPackage.metadata.name}_${format}.${extension}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    if (format === 'openapi') {
      res.send(JSON.stringify(apiPackage.apis[format], null, 2));
    } else {
      res.send(apiPackage.apis[format]);
    }
    
  } catch (error) {
    console.error('Error downloading API:', error);
    res.status(500).json({ error: 'Failed to download API' });
  }
});

/**
 * Get API documentation for a recording
 */
router.get('/recordings/:id/docs', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get recording from storage
    const recording = global.recordings?.get(id);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    if (!recording.automationPackage) {
      return res.status(400).json({ error: 'Recording has not been processed yet' });
    }
    
    // Generate API package
    const apiPackage = await apiExportService.generateAPIPackage(recording, recording.automationPackage);
    
    res.json({
      metadata: apiPackage.metadata,
      documentation: apiPackage.documentation,
      examples: apiPackage.examples,
      deployment: apiPackage.deployment
    });
    
  } catch (error) {
    console.error('Error getting API docs:', error);
    res.status(500).json({ error: 'Failed to get API documentation' });
  }
});

/**
 * Generate deployment package
 */
router.post('/recordings/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform = 'docker' } = req.body;
    
    // Get recording from storage
    const recording = global.recordings?.get(id);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    if (!recording.automationPackage) {
      return res.status(400).json({ error: 'Recording has not been processed yet' });
    }
    
    // Generate API package
    const apiPackage = await apiExportService.generateAPIPackage(recording, recording.automationPackage);
    
    if (!apiPackage.deployment[platform]) {
      return res.status(400).json({ error: `Platform '${platform}' not supported` });
    }
    
    res.json({
      platform,
      config: apiPackage.deployment[platform],
      instructions: getDeploymentInstructions(platform, apiPackage.metadata)
    });
    
  } catch (error) {
    console.error('Error generating deployment config:', error);
    res.status(500).json({ error: 'Failed to generate deployment configuration' });
  }
});

/**
 * Get supported export formats
 */
router.get('/formats', (req, res) => {
  res.json({
    apis: [
      { name: 'express', description: 'Express.js (Node.js)', extension: 'js' },
      { name: 'fastapi', description: 'FastAPI (Python)', extension: 'py' },
      { name: 'flask', description: 'Flask (Python)', extension: 'py' },
      { name: 'openapi', description: 'OpenAPI Specification', extension: 'json' }
    ],
    deployment: [
      { name: 'docker', description: 'Docker containerization' },
      { name: 'kubernetes', description: 'Kubernetes deployment' },
      { name: 'vercel', description: 'Vercel serverless' },
      { name: 'railway', description: 'Railway deployment' }
    ]
  });
});

function getDeploymentInstructions(platform, metadata) {
  const instructions = {
    docker: [
      '1. Save the Dockerfile in your project root',
      '2. Build the image: docker build -t ' + metadata.name + ' .',
      '3. Run the container: docker run -p 3000:3000 ' + metadata.name,
      '4. Access your API at http://localhost:3000'
    ],
    kubernetes: [
      '1. Save the configuration as deployment.yaml',
      '2. Apply to cluster: kubectl apply -f deployment.yaml',
      '3. Check status: kubectl get pods',
      '4. Access via service endpoint'
    ],
    vercel: [
      '1. Save vercel.json in your project root',
      '2. Install Vercel CLI: npm i -g vercel',
      '3. Deploy: vercel --prod',
      '4. Your API will be available at the provided URL'
    ],
    railway: [
      '1. Save railway.json in your project root',
      '2. Connect your GitHub repository to Railway',
      '3. Deploy automatically on push',
      '4. Access via Railway-provided domain'
    ]
  };
  
  return instructions[platform] || ['Platform-specific instructions not available'];
}

module.exports = router;
