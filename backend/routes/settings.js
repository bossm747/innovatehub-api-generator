/**
 * Settings Routes
 * Handles system configuration, AI provider settings, and testing
 */
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');

const router = express.Router();

// Settings file path
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  aiProvider: 'openai',
  aiModel: 'gpt-4.1-mini',
  customBaseUrl: '',
  apiKey: '',
  timeout: 30,
  retryAttempts: 3,
  enableAnalytics: true,
  enableErrorReporting: true,
  maxRecordingDuration: 300,
  autoGenerateAPI: true,
  defaultFramework: 'playwright'
};

/**
 * Load settings from file
 */
async function loadSettings() {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    // Return defaults if file doesn't exist
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to file
 */
async function saveSettings(settings) {
  try {
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Get current settings
 */
router.get('/', async (req, res) => {
  try {
    const settings = await loadSettings();
    
    // Don't send sensitive data like API keys to frontend
    const safeSettings = { ...settings };
    if (safeSettings.apiKey) {
      safeSettings.apiKey = '***masked***';
    }
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load settings'
    });
  }
});

/**
 * Update settings
 */
router.post('/', async (req, res) => {
  try {
    const currentSettings = await loadSettings();
    const newSettings = { ...currentSettings, ...req.body };
    
    // Validate settings
    if (newSettings.timeout < 10 || newSettings.timeout > 300) {
      return res.status(400).json({
        success: false,
        error: 'Timeout must be between 10 and 300 seconds'
      });
    }
    
    if (newSettings.retryAttempts < 1 || newSettings.retryAttempts > 10) {
      return res.status(400).json({
        success: false,
        error: 'Retry attempts must be between 1 and 10'
      });
    }
    
    if (newSettings.maxRecordingDuration < 60 || newSettings.maxRecordingDuration > 3600) {
      return res.status(400).json({
        success: false,
        error: 'Max recording duration must be between 60 and 3600 seconds'
      });
    }
    
    const saved = await saveSettings(newSettings);
    
    if (saved) {
      res.json({
        success: true,
        message: 'Settings saved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save settings'
      });
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save settings'
    });
  }
});

/**
 * Test AI connection
 */
router.post('/test-ai', async (req, res) => {
  try {
    const { provider, model, baseUrl, apiKey } = req.body;
    
    if (!provider || !model) {
      return res.status(400).json({
        success: false,
        error: 'Provider and model are required'
      });
    }
    
    // Load current settings to get API key if not provided
    const currentSettings = await loadSettings();
    const testApiKey = apiKey && apiKey !== '***masked***' ? apiKey : currentSettings.apiKey;
    
    if (!testApiKey && provider !== 'openai') {
      return res.status(400).json({
        success: false,
        error: 'API key is required for this provider'
      });
    }
    
    // Test the AI connection
    const testResult = await testAIProvider(provider, model, baseUrl, testApiKey);
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing AI connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI connection'
    });
  }
});

/**
 * Test AI provider connection
 */
async function testAIProvider(provider, model, baseUrl, apiKey) {
  try {
    let client;
    let testMessage = 'Hello, this is a test message. Please respond with "Test successful".';
    
    // Configure client based on provider
    switch (provider) {
      case 'openai':
        client = new OpenAI({
          apiKey: apiKey || process.env.OPENAI_API_KEY
        });
        break;
        
      case 'anthropic':
        // For Anthropic, we'll use OpenAI-compatible format
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl || 'https://api.anthropic.com/v1'
        });
        break;
        
      case 'gemini':
        client = new OpenAI({
          apiKey: apiKey || process.env.OPENAI_API_KEY,
          baseURL: baseUrl || undefined
        });
        model = 'gemini-2.5-flash'; // Use available model
        break;
        
      case 'openrouter':
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl || 'https://openrouter.ai/api/v1'
        });
        break;
        
      case 'groq':
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl || 'https://api.groq.com/openai/v1'
        });
        break;
        
      case 'deepseek':
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl || 'https://api.deepseek.com/v1'
        });
        break;
        
      case 'custom':
        if (!baseUrl) {
          return {
            success: false,
            error: 'Base URL is required for custom provider'
          };
        }
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl
        });
        break;
        
      default:
        return {
          success: false,
          error: `Unsupported provider: ${provider}`
        };
    }
    
    // Make test request
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: testMessage
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });
    
    if (response.choices && response.choices.length > 0) {
      return {
        success: true,
        message: 'AI connection test successful',
        response: response.choices[0].message.content,
        model: model,
        provider: provider
      };
    } else {
      return {
        success: false,
        error: 'No response received from AI provider'
      };
    }
    
  } catch (error) {
    console.error('AI test error:', error);
    
    let errorMessage = 'Unknown error occurred';
    
    if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid API key';
    } else if (error.code === 'model_not_found') {
      errorMessage = 'Model not found or not accessible';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Insufficient quota or credits';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get available AI providers and models
 */
router.get('/ai-providers', (req, res) => {
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4.1-mini', 'gpt-4.1-nano'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://api.openai.com/v1'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: ['claude-3-sonnet', 'claude-3-haiku'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://api.anthropic.com/v1'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      models: ['gemini-2.5-flash', 'gemini-pro'],
      requiresApiKey: true,
      defaultBaseUrl: null
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      models: ['auto', 'gpt-4', 'claude-3'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://openrouter.ai/api/v1'
    },
    {
      id: 'groq',
      name: 'Groq',
      models: ['llama-3.1-70b', 'mixtral-8x7b'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://api.groq.com/openai/v1'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-coder'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://api.deepseek.com/v1'
    },
    {
      id: 'qwen',
      name: 'Qwen',
      models: ['qwen-turbo', 'qwen-plus'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    },
    {
      id: 'grok',
      name: 'Grok (X.AI)',
      models: ['grok-beta', 'grok-vision'],
      requiresApiKey: true,
      defaultBaseUrl: 'https://api.x.ai/v1'
    },
    {
      id: 'custom',
      name: 'Custom Provider',
      models: ['custom-model'],
      requiresApiKey: true,
      defaultBaseUrl: null
    }
  ];
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * Reset settings to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    const saved = await saveSettings(DEFAULT_SETTINGS);
    
    if (saved) {
      res.json({
        success: true,
        message: 'Settings reset to defaults',
        settings: DEFAULT_SETTINGS
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to reset settings'
      });
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  }
});

module.exports = router;
