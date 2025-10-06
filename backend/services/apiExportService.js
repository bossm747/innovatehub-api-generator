/**
 * API Export Service
 * Generates REST API endpoints and OpenAPI documentation for automation scripts
 */
class APIExportService {
  constructor() {
    this.apiTemplates = {
      express: this.generateExpressAPI.bind(this),
      fastapi: this.generateFastAPI.bind(this),
      flask: this.generateFlaskAPI.bind(this),
      openapi: this.generateOpenAPISpec.bind(this)
    };
  }

  /**
   * Generate API package with multiple formats
   */
  async generateAPIPackage(recording, automationPackage) {
    try {
      const { interactions, metadata } = recording;
      const { analysis, configuration } = automationPackage;

      // Extract parameters from interactions
      const apiParams = this.extractAPIParameters(interactions);
      
      // Generate API metadata
      const apiMetadata = {
        name: this.sanitizeName(metadata.title || `automation_${recording.id}`),
        description: analysis.workflow,
        version: '1.0.0',
        parameters: apiParams,
        endpoints: this.generateEndpoints(apiParams),
        security: this.analyzeSecurity(interactions)
      };

      // Generate different API formats
      const apis = {
        express: this.generateExpressAPI(apiMetadata, automationPackage),
        fastapi: this.generateFastAPI(apiMetadata, automationPackage),
        flask: this.generateFlaskAPI(apiMetadata, automationPackage),
        openapi: this.generateOpenAPISpec(apiMetadata)
      };

      // Generate deployment configurations
      const deployment = {
        docker: this.generateDockerfile(apiMetadata),
        kubernetes: this.generateKubernetesConfig(apiMetadata),
        vercel: this.generateVercelConfig(apiMetadata),
        railway: this.generateRailwayConfig(apiMetadata)
      };

      return {
        metadata: apiMetadata,
        apis,
        deployment,
        documentation: this.generateAPIDocumentation(apiMetadata),
        examples: this.generateUsageExamples(apiMetadata)
      };
    } catch (error) {
      console.error('Error generating API package:', error);
      throw error;
    }
  }

  /**
   * Extract API parameters from interactions
   */
  extractAPIParameters(interactions) {
    const parameters = [];
    const urls = new Set();
    
    interactions.forEach((interaction, index) => {
      switch (interaction.action) {
        case 'navigation':
          urls.add(interaction.url);
          // Extract URL parameters
          try {
            const url = new URL(interaction.url);
            if (url.search) {
              const searchParams = new URLSearchParams(url.search);
              searchParams.forEach((value, key) => {
                parameters.push({
                  name: key,
                  type: 'string',
                  description: `URL parameter from navigation`,
                  example: value,
                  required: false
                });
              });
            }
          } catch (e) {
            // Invalid URL, skip
          }
          break;
          
        case 'type':
          if (interaction.text && interaction.text !== '[PASSWORD]') {
            const fieldName = this.extractFieldName(interaction.selector);
            parameters.push({
              name: fieldName,
              type: this.inferParameterType(interaction.text),
              description: `Input field: ${interaction.selector}`,
              example: interaction.text,
              required: true,
              sensitive: interaction.inputType === 'password'
            });
          }
          break;
      }
    });

    // Add configuration parameters
    parameters.push({
      name: 'headless',
      type: 'boolean',
      description: 'Run browser in headless mode',
      example: true,
      required: false,
      default: true
    });

    parameters.push({
      name: 'timeout',
      type: 'integer',
      description: 'Maximum timeout in milliseconds',
      example: 30000,
      required: false,
      default: 30000
    });

    return this.deduplicateParameters(parameters);
  }

  /**
   * Generate Express.js API
   */
  generateExpressAPI(metadata, automationPackage) {
    const { scripts } = automationPackage;
    
    return `const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting (optional)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

/**
 * ${metadata.description}
 * Generated API for browser automation
 */
app.post('/api/${metadata.name}/execute', async (req, res) => {
  try {
    const {
${metadata.parameters.map(p => `      ${p.name} = ${JSON.stringify(p.default || p.example)}`).join(',\n')}
    } = req.body;

    // Validate required parameters
${metadata.parameters.filter(p => p.required).map(p => 
`    if (!${p.name}) {
      return res.status(400).json({ error: '${p.name} is required' });
    }`).join('\n')}

    // Execute automation
    const result = await runAutomation({
${metadata.parameters.map(p => `      ${p.name}`).join(',\n')}
    });

    res.json({
      success: true,
      result,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Automation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      executedAt: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '${metadata.name}' });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: '${metadata.name}',
    description: '${metadata.description}',
    version: '${metadata.version}',
    endpoints: ${JSON.stringify(metadata.endpoints, null, 2)},
    parameters: ${JSON.stringify(metadata.parameters, null, 2)}
  });
});

// Automation function
${scripts.playwright.enhanced}

app.listen(PORT, () => {
  console.log(\`🚀 ${metadata.name} API running on port \${PORT}\`);
  console.log(\`📖 Documentation: http://localhost:\${PORT}/api/docs\`);
});

module.exports = app;`;
  }

  /**
   * Generate FastAPI Python code
   */
  generateFastAPI(metadata, automationPackage) {
    return `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio
from playwright.async_api import async_playwright
import uvicorn

app = FastAPI(
    title="${metadata.name}",
    description="${metadata.description}",
    version="${metadata.version}"
)

class AutomationRequest(BaseModel):
${metadata.parameters.map(p => {
  const pythonType = this.getPythonType(p.type);
  const optional = p.required ? '' : 'Optional[';
  const closing = p.required ? '' : '] = None';
  return `    ${p.name}: ${optional}${pythonType}${closing}`;
}).join('\n')}

class AutomationResponse(BaseModel):
    success: bool
    result: Optional[dict] = None
    error: Optional[str] = None
    executed_at: str

@app.post("/api/${metadata.name}/execute", response_model=AutomationResponse)
async def execute_automation(request: AutomationRequest):
    try:
        # Validate required parameters
${metadata.parameters.filter(p => p.required).map(p => 
`        if not request.${p.name}:
            raise HTTPException(status_code=400, detail="${p.name} is required")`).join('\n')}

        # Execute automation
        result = await run_automation(
${metadata.parameters.map(p => `            ${p.name}=request.${p.name}`).join(',\n')}
        )
        
        return AutomationResponse(
            success=True,
            result=result,
            executed_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        return AutomationResponse(
            success=False,
            error=str(e),
            executed_at=datetime.now().isoformat()
        )

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "${metadata.name}"}

async def run_automation(**kwargs):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=kwargs.get('headless', True))
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Automation logic would go here
            # This is a placeholder - implement based on recorded interactions
            result = {"message": "Automation completed successfully"}
            return result
        finally:
            await browser.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)`;
  }

  /**
   * Generate Flask API
   */
  generateFlaskAPI(metadata, automationPackage) {
    return `from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
from playwright.async_api import async_playwright
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/${metadata.name}/execute', methods=['POST'])
def execute_automation():
    try:
        data = request.get_json()
        
        # Extract parameters
${metadata.parameters.map(p => 
`        ${p.name} = data.get('${p.name}', ${JSON.stringify(p.default || p.example)})`).join('\n')}

        # Validate required parameters
${metadata.parameters.filter(p => p.required).map(p => 
`        if not ${p.name}:
            return jsonify({'error': '${p.name} is required'}), 400`).join('\n')}

        # Execute automation
        result = asyncio.run(run_automation(
${metadata.parameters.map(p => `            ${p.name}=${p.name}`).join(',\n')}
        ))
        
        return jsonify({
            'success': True,
            'result': result,
            'executed_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'executed_at': datetime.now().isoformat()
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': '${metadata.name}'})

@app.route('/api/docs', methods=['GET'])
def api_docs():
    return jsonify({
        'name': '${metadata.name}',
        'description': '${metadata.description}',
        'version': '${metadata.version}',
        'endpoints': ${JSON.stringify(metadata.endpoints, null, 2)},
        'parameters': ${JSON.stringify(metadata.parameters, null, 2)}
    })

async def run_automation(**kwargs):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=kwargs.get('headless', True))
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Automation logic implementation
            result = {"message": "Automation completed successfully"}
            return result
        finally:
            await browser.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)`;
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPISpec(metadata) {
    return {
      openapi: '3.0.3',
      info: {
        title: metadata.name,
        description: metadata.description,
        version: metadata.version,
        contact: {
          name: 'Browser Automation Studio',
          url: 'https://github.com/your-repo'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://your-api.com',
          description: 'Production server'
        }
      ],
      paths: {
        [`/api/${metadata.name}/execute`]: {
          post: {
            summary: 'Execute automation',
            description: metadata.description,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: metadata.parameters.reduce((props, param) => {
                      props[param.name] = {
                        type: param.type,
                        description: param.description,
                        example: param.example
                      };
                      if (param.default !== undefined) {
                        props[param.name].default = param.default;
                      }
                      return props;
                    }, {}),
                    required: metadata.parameters.filter(p => p.required).map(p => p.name)
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Automation executed successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        result: { type: 'object' },
                        executed_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Bad request - missing required parameters'
              },
              '500': {
                description: 'Internal server error'
              }
            }
          }
        },
        '/health': {
          get: {
            summary: 'Health check',
            responses: {
              '200': {
                description: 'Service is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        service: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: metadata.security.requiresAuth ? {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        } : {}
      }
    };
  }

  /**
   * Generate Dockerfile
   */
  generateDockerfile(metadata) {
    return `FROM node:18-alpine

# Install Playwright dependencies
RUN apk add --no-cache \\
    chromium \\
    nss \\
    freetype \\
    freetype-dev \\
    harfbuzz \\
    ca-certificates \\
    ttf-freefont

# Set Playwright to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \\
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]`;
  }

  /**
   * Generate Kubernetes configuration
   */
  generateKubernetesConfig(metadata) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${metadata.name}
  labels:
    app: ${metadata.name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${metadata.name}
  template:
    metadata:
      labels:
        app: ${metadata.name}
    spec:
      containers:
      - name: ${metadata.name}
        image: ${metadata.name}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ${metadata.name}-service
spec:
  selector:
    app: ${metadata.name}
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer`;
  }

  /**
   * Generate Vercel configuration
   */
  generateVercelConfig(metadata) {
    return {
      version: 2,
      name: metadata.name,
      builds: [
        {
          src: 'package.json',
          use: '@vercel/node'
        }
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: '/api/$1'
        }
      ],
      env: {
        NODE_ENV: 'production'
      }
    };
  }

  /**
   * Generate Railway configuration
   */
  generateRailwayConfig(metadata) {
    return {
      build: {
        builder: 'NIXPACKS'
      },
      deploy: {
        startCommand: 'npm start',
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10
      }
    };
  }

  // Helper methods
  sanitizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  extractFieldName(selector) {
    if (selector.includes('name=')) {
      return selector.match(/name="([^"]+)"/)?.[1] || 'field';
    }
    if (selector.includes('id=')) {
      return selector.match(/id="([^"]+)"/)?.[1] || 'field';
    }
    return 'field';
  }

  inferParameterType(value) {
    if (typeof value === 'boolean') return 'boolean';
    if (!isNaN(value) && !isNaN(parseFloat(value))) return 'number';
    if (value.includes('@')) return 'email';
    return 'string';
  }

  getPythonType(jsType) {
    const typeMap = {
      'string': 'str',
      'number': 'float',
      'integer': 'int',
      'boolean': 'bool',
      'email': 'str'
    };
    return typeMap[jsType] || 'str';
  }

  deduplicateParameters(parameters) {
    const seen = new Set();
    return parameters.filter(param => {
      if (seen.has(param.name)) return false;
      seen.add(param.name);
      return true;
    });
  }

  generateEndpoints(parameters) {
    return [
      {
        path: '/execute',
        method: 'POST',
        description: 'Execute the automation with provided parameters'
      },
      {
        path: '/health',
        method: 'GET',
        description: 'Check service health status'
      },
      {
        path: '/docs',
        method: 'GET',
        description: 'Get API documentation'
      }
    ];
  }

  analyzeSecurity(interactions) {
    const hasPasswordFields = interactions.some(i => i.inputType === 'password');
    const hasFormSubmission = interactions.some(i => i.action === 'submit');
    
    return {
      requiresAuth: hasPasswordFields,
      hasFormSubmission,
      sensitiveData: hasPasswordFields,
      recommendations: hasPasswordFields ? 
        ['Use environment variables for sensitive data', 'Implement proper authentication'] : 
        ['Consider rate limiting', 'Validate input parameters']
    };
  }

  generateAPIDocumentation(metadata) {
    return `# ${metadata.name} API

${metadata.description}

## Overview

This API provides programmatic access to browser automation functionality. It was automatically generated from recorded user interactions.

## Authentication

${metadata.security.requiresAuth ? 
  'This API requires authentication. Include your API key in the Authorization header.' : 
  'No authentication required for this API.'}

## Endpoints

### POST /api/${metadata.name}/execute

Execute the automation with the provided parameters.

**Parameters:**

${metadata.parameters.map(p => `- \`${p.name}\` (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`).join('\n')}

**Example Request:**

\`\`\`bash
curl -X POST http://localhost:3000/api/${metadata.name}/execute \\
  -H "Content-Type: application/json" \\
  -d '{
${metadata.parameters.map(p => `    "${p.name}": ${JSON.stringify(p.example)}`).join(',\n')}
  }'
\`\`\`

**Example Response:**

\`\`\`json
{
  "success": true,
  "result": {
    "message": "Automation completed successfully"
  },
  "executed_at": "2024-01-01T12:00:00Z"
}
\`\`\`

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 400: Bad Request (missing required parameters)
- 500: Internal Server Error

## Rate Limiting

This API is rate limited to 100 requests per 15 minutes per IP address.

## Support

For support and questions, please refer to the documentation or contact the development team.
`;
  }

  generateUsageExamples(metadata) {
    return {
      curl: `curl -X POST http://localhost:3000/api/${metadata.name}/execute \\
  -H "Content-Type: application/json" \\
  -d '{
${metadata.parameters.map(p => `    "${p.name}": ${JSON.stringify(p.example)}`).join(',\n')}
  }'`,
      
      javascript: `const response = await fetch('http://localhost:3000/api/${metadata.name}/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
${metadata.parameters.map(p => `    ${p.name}: ${JSON.stringify(p.example)}`).join(',\n')}
  })
});

const result = await response.json();
console.log(result);`,

      python: `import requests

response = requests.post('http://localhost:3000/api/${metadata.name}/execute', json={
${metadata.parameters.map(p => `    '${p.name}': ${JSON.stringify(p.example)}`).join(',\n')}
})

result = response.json()
print(result)`
    };
  }
}

module.exports = APIExportService;
