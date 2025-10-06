/**
 * Browser Interaction Recorder
 * Captures user interactions and converts them to automation-friendly format
 */

class BrowserRecorder {
  constructor() {
    this.isRecording = false;
    this.interactions = [];
    this.startTime = null;
    this.listeners = [];
    this.currentUrl = window.location.href;
  }

  // Start recording user interactions
  startRecording() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.interactions = [];
    this.startTime = Date.now();
    this.currentUrl = window.location.href;
    
    // Record initial navigation
    this.addInteraction({
      action: 'navigation',
      url: this.currentUrl,
      timestamp: Date.now()
    });
    
    this.attachEventListeners();
    console.log('🔴 Recording started');
  }

  // Stop recording and return interactions
  stopRecording() {
    if (!this.isRecording) return [];
    
    this.isRecording = false;
    this.removeEventListeners();
    
    console.log('⏹️ Recording stopped', this.interactions);
    return this.interactions;
  }

  // Add an interaction to the recording
  addInteraction(interaction) {
    if (!this.isRecording) return;
    
    this.interactions.push({
      ...interaction,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime
    });
  }

  // Attach event listeners for various user interactions
  attachEventListeners() {
    // Click events
    const clickHandler = (event) => {
      const selector = this.generateSelector(event.target);
      this.addInteraction({
        action: 'click',
        selector,
        element: event.target.tagName.toLowerCase(),
        coordinates: {
          x: event.clientX,
          y: event.clientY
        },
        text: event.target.textContent?.trim() || ''
      });
    };

    // Input events (typing)
    const inputHandler = (event) => {
      if (event.target.type === 'password') {
        // Don't record actual password values for security
        this.addInteraction({
          action: 'type',
          selector: this.generateSelector(event.target),
          element: event.target.tagName.toLowerCase(),
          text: '[PASSWORD]',
          inputType: event.target.type
        });
      } else {
        this.addInteraction({
          action: 'type',
          selector: this.generateSelector(event.target),
          element: event.target.tagName.toLowerCase(),
          text: event.target.value,
          inputType: event.target.type
        });
      }
    };

    // Form submission
    const submitHandler = (event) => {
      this.addInteraction({
        action: 'submit',
        selector: this.generateSelector(event.target),
        element: event.target.tagName.toLowerCase()
      });
    };

    // Scroll events
    const scrollHandler = () => {
      this.addInteraction({
        action: 'scroll',
        x: window.scrollX,
        y: window.scrollY
      });
    };

    // Navigation events
    const navigationHandler = () => {
      const newUrl = window.location.href;
      if (newUrl !== this.currentUrl) {
        this.currentUrl = newUrl;
        this.addInteraction({
          action: 'navigation',
          url: newUrl
        });
      }
    };

    // Key events
    const keyHandler = (event) => {
      // Only record special keys
      if (['Enter', 'Tab', 'Escape'].includes(event.key)) {
        this.addInteraction({
          action: 'keypress',
          key: event.key,
          selector: this.generateSelector(event.target)
        });
      }
    };

    // Attach all listeners
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('input', inputHandler, true);
    document.addEventListener('submit', submitHandler, true);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('popstate', navigationHandler);
    document.addEventListener('keydown', keyHandler, true);

    // Store listeners for cleanup
    this.listeners = [
      { element: document, event: 'click', handler: clickHandler, options: true },
      { element: document, event: 'input', handler: inputHandler, options: true },
      { element: document, event: 'submit', handler: submitHandler, options: true },
      { element: window, event: 'scroll', handler: scrollHandler, options: { passive: true } },
      { element: window, event: 'popstate', handler: navigationHandler },
      { element: document, event: 'keydown', handler: keyHandler, options: true }
    ];
  }

  // Remove all event listeners
  removeEventListeners() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
  }

  // Generate a robust CSS selector for an element
  generateSelector(element) {
    if (!element || element === document) return 'document';
    
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Try data attributes
    if (element.dataset.testid) {
      return `[data-testid="${element.dataset.testid}"]`;
    }
    
    // Try name attribute for form elements
    if (element.name) {
      return `[name="${element.name}"]`;
    }
    
    // Try class names (use the first meaningful class)
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(cls => 
        cls && !cls.startsWith('_') && cls.length > 2
      );
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    // Try aria-label
    if (element.getAttribute('aria-label')) {
      return `[aria-label="${element.getAttribute('aria-label')}"]`;
    }
    
    // Try placeholder for inputs
    if (element.placeholder) {
      return `[placeholder="${element.placeholder}"]`;
    }
    
    // Try text content for buttons and links
    if (['BUTTON', 'A'].includes(element.tagName) && element.textContent) {
      const text = element.textContent.trim();
      if (text.length < 50) {
        return `${element.tagName.toLowerCase()}:contains("${text}")`;
      }
    }
    
    // Fall back to nth-child selector
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      const parentSelector = this.generateSelector(parent);
      return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
    
    return element.tagName.toLowerCase();
  }

  // Get current recording status
  getStatus() {
    return {
      isRecording: this.isRecording,
      interactionCount: this.interactions.length,
      duration: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  // Clear all recorded interactions
  clear() {
    this.interactions = [];
    this.startTime = null;
  }
}

// Create a global instance
const recorder = new BrowserRecorder();

export default recorder;
