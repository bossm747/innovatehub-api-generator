const AIService = require('./aiService');

/**
 * Advanced Script Generator Service
 * Generates multiple automation script formats with intelligent analysis
 */
class ScriptGenerator {
  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Generate comprehensive automation package
   */
  async generateAutomationPackage(interactions, metadata = {}) {
    try {
      console.log('Generating automation package for', interactions.length, 'interactions');
      
      // 1. Generate basic Playwright script
      const basicScript = this.generateBasicPlaywrightScript(interactions);
      
      // 2. Analyze interactions with AI
      const analysis = await this.aiService.analyzeInteractions(interactions);
      
      // 3. Generate enhanced script with AI
      const enhancedScript = await this.aiService.generateEnhancedScript(
        basicScript, 
        interactions, 
        metadata
      );
      
      // 4. Generate alternative formats
      const puppeteerScript = this.generatePuppeteerScript(interactions);
      const seleniumScript = this.generateSeleniumScript(interactions);
      const cypressScript = this.generateCypressScript(interactions);
      
      // 5. Generate API documentation
      const apiDoc = await this.aiService.generateAPIDocumentation(enhancedScript, interactions);
      
      // 6. Generate configuration file
      const config = this.generateConfigFile(interactions, analysis);
      
      return {
        analysis,
        scripts: {
          playwright: {
            basic: basicScript,
            enhanced: enhancedScript
          },
          puppeteer: puppeteerScript,
          selenium: seleniumScript,
          cypress: cypressScript
        },
        documentation: apiDoc,
        configuration: config,
        metadata: {
          ...metadata,
          generatedAt: new Date().toISOString(),
          interactionCount: interactions.length,
          complexity: analysis.complexity,
          estimatedRuntime: this.estimateRuntime(interactions)
        }
      };
    } catch (error) {
      console.error('Error generating automation package:', error);
      throw error;
    }
  }

  /**
   * Generate basic Playwright script
   */
  generateBasicPlaywrightScript(interactions) {
    let script = `const { chromium } = require('playwright');

/**
 * Generated Browser Automation Script
 * Created: ${new Date().toISOString()}
 * Interactions: ${interactions.length}
 */

async function runAutomation(config = {}) {
  const browser = await chromium.launch({ 
    headless: config.headless ?? false,
    slowMo: config.slowMo ?? 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
`;

    interactions.forEach((interaction, index) => {
      script += this.generateInteractionCode(interaction, index);
    });

    script += `
    console.log('✅ Automation completed successfully');
    
  } catch (error) {
    console.error('❌ Automation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Export for use as module
module.exports = { runAutomation };

// Run directly if called from command line
if (require.main === module) {
  runAutomation()
    .then(() => console.log('Script execution completed'))
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}`;

    return script;
  }

  /**
   * Generate code for individual interaction
   */
  generateInteractionCode(interaction, index) {
    const stepComment = `    // Step ${index + 1}: ${interaction.action}`;
    
    switch (interaction.action) {
      case 'navigation':
        return `${stepComment}
    console.log('Navigating to: ${interaction.url}');
    await page.goto('${interaction.url}', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

`;

      case 'click':
        return `${stepComment}
    console.log('Clicking element: ${interaction.selector}');
    await page.waitForSelector('${interaction.selector}', { timeout: 10000 });
    await page.click('${interaction.selector}');
    await page.waitForTimeout(500); // Brief pause after click

`;

      case 'type':
        const text = interaction.text === '[PASSWORD]' ? '${config.password || "[PASSWORD]"}' : interaction.text;
        return `${stepComment}
    console.log('Typing into element: ${interaction.selector}');
    await page.waitForSelector('${interaction.selector}', { timeout: 10000 });
    await page.fill('${interaction.selector}', '${text}');

`;

      case 'scroll':
        return `${stepComment}
    console.log('Scrolling to position: ${interaction.x}, ${interaction.y}');
    await page.evaluate(() => window.scrollTo(${interaction.x || 0}, ${interaction.y || 0}));
    await page.waitForTimeout(300);

`;

      case 'wait':
        return `${stepComment}
    console.log('Waiting for element: ${interaction.selector}');
    await page.waitForSelector('${interaction.selector}', { timeout: 15000 });

`;

      case 'keypress':
        return `${stepComment}
    console.log('Pressing key: ${interaction.key}');
    await page.keyboard.press('${interaction.key}');

`;

      case 'submit':
        return `${stepComment}
    console.log('Submitting form: ${interaction.selector}');
    await page.waitForSelector('${interaction.selector}', { timeout: 10000 });
    await page.click('${interaction.selector}');
    await page.waitForLoadState('networkidle');

`;

      default:
        return `${stepComment}
    // Unsupported action: ${interaction.action}

`;
    }
  }

  /**
   * Generate Puppeteer script
   */
  generatePuppeteerScript(interactions) {
    let script = `const puppeteer = require('puppeteer');

/**
 * Puppeteer Automation Script
 * Generated: ${new Date().toISOString()}
 */

async function runAutomation() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
`;

    interactions.forEach((interaction, index) => {
      switch (interaction.action) {
        case 'navigation':
          script += `    // Step ${index + 1}: Navigate
    await page.goto('${interaction.url}', { waitUntil: 'networkidle2' });

`;
          break;
        case 'click':
          script += `    // Step ${index + 1}: Click
    await page.waitForSelector('${interaction.selector}');
    await page.click('${interaction.selector}');

`;
          break;
        case 'type':
          script += `    // Step ${index + 1}: Type
    await page.waitForSelector('${interaction.selector}');
    await page.type('${interaction.selector}', '${interaction.text}');

`;
          break;
      }
    });

    script += `  } catch (error) {
    console.error('Automation failed:', error);
  } finally {
    await browser.close();
  }
}

runAutomation();`;

    return script;
  }

  /**
   * Generate Selenium script
   */
  generateSeleniumScript(interactions) {
    return `const { Builder, By, until } = require('selenium-webdriver');

/**
 * Selenium WebDriver Automation Script
 * Generated: ${new Date().toISOString()}
 */

async function runAutomation() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
${interactions.map((interaction, index) => {
  switch (interaction.action) {
    case 'navigation':
      return `    // Step ${index + 1}: Navigate
    await driver.get('${interaction.url}');`;
    case 'click':
      return `    // Step ${index + 1}: Click
    await driver.wait(until.elementLocated(By.css('${interaction.selector}')), 10000);
    await driver.findElement(By.css('${interaction.selector}')).click();`;
    case 'type':
      return `    // Step ${index + 1}: Type
    await driver.wait(until.elementLocated(By.css('${interaction.selector}')), 10000);
    await driver.findElement(By.css('${interaction.selector}')).sendKeys('${interaction.text}');`;
    default:
      return `    // Step ${index + 1}: ${interaction.action}`;
  }
}).join('\n\n')}
  } catch (error) {
    console.error('Automation failed:', error);
  } finally {
    await driver.quit();
  }
}

runAutomation();`;
  }

  /**
   * Generate Cypress script
   */
  generateCypressScript(interactions) {
    return `/**
 * Cypress E2E Test
 * Generated: ${new Date().toISOString()}
 */

describe('Recorded User Flow', () => {
  it('should execute recorded interactions', () => {
${interactions.map((interaction, index) => {
  switch (interaction.action) {
    case 'navigation':
      return `    // Step ${index + 1}: Navigate
    cy.visit('${interaction.url}');`;
    case 'click':
      return `    // Step ${index + 1}: Click
    cy.get('${interaction.selector}').click();`;
    case 'type':
      return `    // Step ${index + 1}: Type
    cy.get('${interaction.selector}').type('${interaction.text}');`;
    default:
      return `    // Step ${index + 1}: ${interaction.action}`;
  }
}).join('\n\n')}
  });
});`;
  }

  /**
   * Generate configuration file
   */
  generateConfigFile(interactions, analysis) {
    const urls = interactions
      .filter(i => i.action === 'navigation')
      .map(i => i.url);
    
    const selectors = interactions
      .filter(i => i.selector)
      .map(i => i.selector);

    return {
      automation: {
        name: `Automation_${Date.now()}`,
        description: analysis.workflow,
        complexity: analysis.complexity,
        estimatedDuration: this.estimateRuntime(interactions)
      },
      browser: {
        headless: false,
        slowMo: 100,
        timeout: 30000,
        viewport: {
          width: 1280,
          height: 720
        }
      },
      targets: {
        urls: [...new Set(urls)],
        selectors: [...new Set(selectors)]
      },
      security: {
        passwordFields: interactions.filter(i => i.text === '[PASSWORD]').length,
        sensitiveData: analysis.security || []
      },
      optimization: {
        caching: true,
        retries: 3,
        parallelization: false
      }
    };
  }

  /**
   * Estimate script runtime
   */
  estimateRuntime(interactions) {
    let estimatedMs = 0;
    
    interactions.forEach(interaction => {
      switch (interaction.action) {
        case 'navigation':
          estimatedMs += 3000; // Page load time
          break;
        case 'click':
          estimatedMs += 500;
          break;
        case 'type':
          estimatedMs += interaction.text ? interaction.text.length * 50 : 500;
          break;
        case 'scroll':
          estimatedMs += 300;
          break;
        case 'wait':
          estimatedMs += 2000;
          break;
        default:
          estimatedMs += 200;
      }
    });
    
    return `${Math.ceil(estimatedMs / 1000)}s`;
  }
}

module.exports = ScriptGenerator;
