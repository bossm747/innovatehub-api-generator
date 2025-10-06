const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { chromium } = require('playwright');
const ScriptGenerator = require('./services/scriptGenerator');
const DatabaseService = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const scriptGenerator = new ScriptGenerator();
const db = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'static')));

// Initialize database connection
let dbInitialized = false;
db.initialize().then(success => {
  dbInitialized = success;
  if (success) {
    console.log('✅ Database service initialized');
  } else {
    console.log('❌ Database service failed to initialize');
  }
});

// Make database globally accessible for API export
global.db = db;

// Import API export routes
const apiExportRoutes = require('./routes/apiExport');
app.use('/api/export', apiExportRoutes);

// Import live API routes
const liveAPIRoutes = require('./routes/liveAPI');
app.use('/api/live', liveAPIRoutes);

// Import settings routes
const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settingsRoutes);

// API Routes
// Create a new recording
app.post('/api/recordings', async (req, res) => {
  try {
    if (!dbInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { interactions, metadata } = req.body;
    const title = metadata?.title || `Recording ${new Date().toISOString()}`;
    const description = metadata?.description || 'Browser automation recording';
    
    const recording = await db.createRecording({
      title,
      description,
      interactions,
      metadata: metadata || {}
    });
    
    // Process the recording asynchronously
    processRecording(recording.id, interactions);
    
    res.json({ 
      id: recording.id, 
      status: 'processing',
      message: 'Recording submitted for processing'
    });
  } catch (error) {
    console.error('Error creating recording:', error);
    res.status(500).json({ error: 'Failed to create recording' });
  }
});

// Get all recordings
app.get('/api/recordings', async (req, res) => {
  try {
    if (!dbInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const recordings = await db.getAllRecordings();
    res.json(recordings);
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Get a specific recording
app.get('/api/recordings/:id', async (req, res) => {
  try {
    if (!dbInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const recording = await db.getRecording(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    res.json(recording);
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

// Process recording and generate script
async function processRecording(recordingId, interactions) {
  try {
    if (!dbInitialized) {
      console.error('Database not initialized for processing recording:', recordingId);
      return;
    }

    const recording = await db.getRecording(recordingId);
    if (!recording) {
      console.error('Recording not found:', recordingId);
      return;
    }
    
    console.log(`Processing recording ${recordingId} with ${interactions.length} interactions`);
    
    // Generate comprehensive automation package using AI
    const automationPackage = await scriptGenerator.generateAutomationPackage(
      interactions, 
      recording.metadata
    );
    
    // Update recording with generated automation package
    await db.updateRecording(recordingId, {
      status: 'completed',
      automation_package: automationPackage,
      completed_at: new Date()
    });
    
    // Auto-register API if automation package includes API export
    try {
      if (automationPackage.apiPackage) {
        const apiData = {
          recording_id: recordingId,
          name: recording.title || `API for ${recordingId}`,
          description: recording.description || 'Generated API from browser automation',
          version: '1.0.0',
          endpoints: automationPackage.apiPackage.endpoints || [],
          openapi_spec: automationPackage.apiPackage.openapi || {}
        };
        
        await db.createAPI(apiData);
        console.log(`API registered for recording ${recordingId}`);
      }
    } catch (apiError) {
      console.error('Failed to register API:', apiError);
    }
    
    console.log(`Recording ${recordingId} processed successfully`);
    
  } catch (error) {
    console.error('Error processing recording:', error);
    
    try {
      await db.updateRecording(recordingId, {
        status: 'error',
        error_message: error.message
      });
    } catch (updateError) {
      console.error('Failed to update recording with error:', updateError);
    }
  }
}

// API endpoint to get AI service statistics
app.get('/api/ai/stats', (req, res) => {
  try {
    const stats = scriptGenerator.aiService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get AI stats' });
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbInitialized ? 'connected' : 'disconnected',
    services: {
      database: dbInitialized,
      scriptGenerator: true
    }
  });
});

// Serve the React app for any non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Innovatehub API Generator running on port ${PORT}`);
  console.log(`📊 Database: ${dbInitialized ? 'Connected' : 'Disconnected'}`);
  console.log(`🌐 Frontend: Serving static files from /static`);
});
