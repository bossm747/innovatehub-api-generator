const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { chromium } = require('playwright');
const ScriptGenerator = require('./services/scriptGenerator');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const scriptGenerator = new ScriptGenerator();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for recordings (in production, use a database)
const recordings = new Map();

// Make recordings globally accessible for API export
global.recordings = recordings;

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
    const { interactions, metadata } = req.body;
    const recordingId = uuidv4();
    
    const recording = {
      id: recordingId,
      interactions,
      metadata: metadata || {},
      status: 'processing',
      createdAt: new Date().toISOString(),
      script: null,
      error: null
    };
    
    recordings.set(recordingId, recording);
    
    // Process the recording asynchronously
    processRecording(recordingId, interactions);
    
    res.json({ 
      id: recordingId, 
      status: 'processing',
      message: 'Recording submitted for processing'
    });
  } catch (error) {
    console.error('Error creating recording:', error);
    res.status(500).json({ error: 'Failed to create recording' });
  }
});

// Get a specific recording
app.get('/api/recordings/:id', (req, res) => {
  const { id } = req.params;
  const recording = recordings.get(id);
  
  if (!recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  
  res.json(recording);
});

// Get all recordings
app.get('/api/recordings', (req, res) => {
  const allRecordings = Array.from(recordings.values()).map(recording => ({
    id: recording.id,
    status: recording.status,
    createdAt: recording.createdAt,
    metadata: recording.metadata
  }));
  
  res.json(allRecordings);
});

// Process recording and generate script
async function processRecording(recordingId, interactions) {
  try {
    const recording = recordings.get(recordingId);
    if (!recording) return;
    
    console.log(`Processing recording ${recordingId} with ${interactions.length} interactions`);
    
    // Generate comprehensive automation package using AI
    const automationPackage = await scriptGenerator.generateAutomationPackage(
      interactions, 
      recording.metadata
    );
    
    // Update recording with generated automation package
    recording.status = 'completed';
    recording.automationPackage = automationPackage;
    recording.completedAt = new Date().toISOString();
    
    recordings.set(recordingId, recording);
    
    // Auto-register API if automation package includes API export
    try {
      if (automationPackage.apiPackage) {
        const apiRegistry = liveAPIRoutes.apiRegistry;
        await apiRegistry.registerAPI(recording, automationPackage, automationPackage.apiPackage);
        console.log(`API registered for recording ${recordingId}`);
      }
    } catch (apiError) {
      console.error('Failed to register API:', apiError);
    }
    
    console.log(`Recording ${recordingId} processed successfully`);
    
  } catch (error) {
    console.error('Error processing recording:', error);
    const recording = recordings.get(recordingId);
    if (recording) {
      recording.status = 'error';
      recording.error = error.message;
      recordings.set(recordingId, recording);
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
