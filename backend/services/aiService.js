const { OpenAI } = require('openai');

/**
 * AI Service for Browser Automation Script Generation
 * Provides intelligent script generation with redundancy and cost optimization
 */
class AIService {
  constructor() {
    this.openai = new OpenAI();
    this.models = [
      'gemini-2.5-flash',  // Primary model - cost-effective and intelligent
      'gpt-4.1-mini',      // Fallback model 1
      'gpt-4.1-nano'       // Fallback model 2 - most cost-effective
    ];
    this.currentModelIndex = 0;
    this.requestCache = new Map();
    this.maxCacheSize = 100;
  }

  /**
   * Generate enhanced automation script with AI analysis
   */
  async generateEnhancedScript(playwrightScript, interactions, metadata = {}) {
    const cacheKey = this.generateCacheKey(interactions);
    
    // Check cache first for cost optimization
    if (this.requestCache.has(cacheKey)) {
      console.log('Returning cached AI response');
      return this.requestCache.get(cacheKey);
    }

    const prompt = this.buildEnhancementPrompt(playwrightScript, interactions, metadata);
    
    // Try models with redundancy
    for (let attempt = 0; attempt < this.models.length; attempt++) {
      try {
        const model = this.models[this.currentModelIndex];
        console.log(`Attempting script enhancement with model: ${model}`);
        
        const response = await this.callAI(prompt, model);
        
        // Cache successful response
        this.cacheResponse(cacheKey, response);
        
        return response;
      } catch (error) {
        console.error(`Model ${this.models[this.currentModelIndex]} failed:`, error.message);
        
        // Switch to next model for redundancy
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
        
        if (attempt === this.models.length - 1) {
          throw new Error('All AI models failed. Returning basic script.');
        }
      }
    }
  }

  /**
   * Analyze interactions and suggest improvements
   */
  async analyzeInteractions(interactions) {
    const prompt = this.buildAnalysisPrompt(interactions);
    
    try {
      const model = this.models[this.currentModelIndex];
      const response = await this.callAI(prompt, model, {
        max_tokens: 1000,
        temperature: 0.3
      });
      
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Interaction analysis failed:', error);
      return this.getDefaultAnalysis(interactions);
    }
  }

  /**
   * Generate API documentation for the automation script
   */
  async generateAPIDocumentation(script, interactions) {
    const prompt = this.buildAPIDocPrompt(script, interactions);
    
    try {
      const model = this.models[this.currentModelIndex];
      const response = await this.callAI(prompt, model, {
        max_tokens: 1500,
        temperature: 0.2
      });
      
      return response;
    } catch (error) {
      console.error('API documentation generation failed:', error);
      return this.getDefaultAPIDoc(interactions);
    }
  }

  /**
   * Build enhancement prompt for AI
   */
  buildEnhancementPrompt(playwrightScript, interactions, metadata) {
    return `You are an expert browser automation engineer. Analyze the following user interactions and Playwright script, then provide an enhanced, production-ready version.

**User Context:**
- Total interactions: ${interactions.length}
- Session duration: ${metadata.duration || 'unknown'}
- Target website: ${metadata.url || 'unknown'}

**Original Interactions:**
${JSON.stringify(interactions.slice(0, 10), null, 2)}${interactions.length > 10 ? '\n... (truncated)' : ''}

**Generated Playwright Script:**
\`\`\`javascript
${playwrightScript}
\`\`\`

**Enhancement Requirements:**
1. **Error Handling**: Add comprehensive try-catch blocks and graceful error recovery
2. **Robust Selectors**: Improve selectors with fallback strategies (ID → data-testid → class → text content)
3. **Smart Waits**: Add intelligent waiting strategies for dynamic content
4. **Performance**: Optimize for speed and reliability
5. **Modularity**: Structure code for reusability and maintainability
6. **Security**: Handle sensitive data appropriately
7. **Logging**: Add detailed logging for debugging
8. **Configuration**: Make the script configurable with parameters

**Output Format:**
Provide only the enhanced JavaScript code with detailed comments explaining the improvements. The script should be production-ready and follow best practices.`;
  }

  /**
   * Build analysis prompt for interactions
   */
  buildAnalysisPrompt(interactions) {
    return `Analyze the following browser interactions and provide insights:

**Interactions:**
${JSON.stringify(interactions, null, 2)}

**Analysis Required:**
1. Identify the main workflow/process
2. Detect potential issues or fragile points
3. Suggest optimizations
4. Recommend additional error handling
5. Identify security considerations

Provide a structured analysis in JSON format with the following structure:
{
  "workflow": "description of the main process",
  "issues": ["list of potential issues"],
  "optimizations": ["list of suggested optimizations"],
  "security": ["security considerations"],
  "complexity": "low|medium|high"
}`;
  }

  /**
   * Build API documentation prompt
   */
  buildAPIDocPrompt(script, interactions) {
    return `Generate comprehensive API documentation for this browser automation script:

**Script:**
\`\`\`javascript
${script}
\`\`\`

**Original Interactions:**
${JSON.stringify(interactions.slice(0, 5), null, 2)}

**Documentation Requirements:**
1. Function/method descriptions
2. Parameters and their types
3. Return values
4. Usage examples
5. Error handling
6. Configuration options

Provide the documentation in Markdown format.`;
  }

  /**
   * Call AI with specified model and options
   */
  async callAI(prompt, model, options = {}) {
    const defaultOptions = {
      max_tokens: 2500,
      temperature: 0.3,
      top_p: 0.9
    };

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert browser automation engineer specializing in Playwright and web scraping. Provide clean, production-ready code with comprehensive error handling.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      ...defaultOptions,
      ...options
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate cache key for request caching
   */
  generateCacheKey(interactions) {
    const simplified = interactions.map(i => ({
      action: i.action,
      selector: i.selector,
      url: i.url
    }));
    return Buffer.from(JSON.stringify(simplified)).toString('base64').slice(0, 32);
  }

  /**
   * Cache AI response for cost optimization
   */
  cacheResponse(key, response) {
    if (this.requestCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
    }
    
    this.requestCache.set(key, response);
  }

  /**
   * Parse analysis response from AI
   */
  parseAnalysisResponse(response) {
    try {
      // First try direct JSON parsing
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI analysis response:', error);
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
        }
      }
      
      // Try to find JSON-like content without code blocks
      const jsonLikeMatch = response.match(/\{[\s\S]*\}/);
      if (jsonLikeMatch) {
        try {
          return JSON.parse(jsonLikeMatch[0]);
        } catch (e) {
          console.error('Failed to parse JSON-like content:', e);
        }
      }
      
      // Return a fallback response
      return {
        workflow: 'Browser automation workflow',
        complexity: 'medium',
        patterns: ['navigation', 'interaction'],
        recommendations: ['Add error handling', 'Use explicit waits'],
        security: { level: 'low', concerns: [] }
      };
    }
  }

  /**
   * Get default analysis when AI fails
   */
  getDefaultAnalysis(interactions) {
    return {
      workflow: `Automation workflow with ${interactions.length} interactions`,
      issues: ['Manual review required - AI analysis unavailable'],
      optimizations: ['Add explicit waits', 'Improve error handling'],
      security: ['Review for sensitive data handling'],
      complexity: interactions.length > 10 ? 'high' : interactions.length > 5 ? 'medium' : 'low'
    };
  }

  /**
   * Get default API documentation when AI fails
   */
  getDefaultAPIDoc(interactions) {
    return `# Browser Automation Script

## Overview
This script automates ${interactions.length} browser interactions.

## Usage
\`\`\`javascript
const { chromium } = require('playwright');
// Run the automation script
\`\`\`

## Configuration
- Modify selectors as needed for your target website
- Adjust timeouts based on your network conditions
- Update input values for your specific use case

## Error Handling
The script includes basic error handling. Monitor execution and adjust as needed.
`;
  }

  /**
   * Get current model statistics
   */
  getStats() {
    return {
      currentModel: this.models[this.currentModelIndex],
      cacheSize: this.requestCache.size,
      availableModels: this.models
    };
  }
}

module.exports = AIService;
