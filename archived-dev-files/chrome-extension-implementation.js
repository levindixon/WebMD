/**
 * Chrome Extension Implementation for HTML to Markdown Conversion
 */

// Content script that runs on web pages
class ChromeExtensionMarkdownConverter {
  constructor() {
    this.parser = new HTMLToMarkdownParser({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      linkStyle: 'inline',
      emDelimiter: '*',
      strongDelimiter: '**'
    });
  }

  /**
   * Convert selected content to Markdown
   */
  convertSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    // Pre-process to handle Chrome-specific issues
    this.preprocessDOM(container);
    
    return this.parser.convert(container);
  }

  /**
   * Convert entire page to Markdown
   */
  convertPage() {
    const mainContent = this.findMainContent();
    
    if (mainContent) {
      const clonedContent = mainContent.cloneNode(true);
      this.preprocessDOM(clonedContent);
      return this.parser.convert(clonedContent);
    }
    
    // Fallback to body
    const body = document.body.cloneNode(true);
    this.removeUnwantedElements(body);
    this.preprocessDOM(body);
    return this.parser.convert(body);
  }

  /**
   * Find main content area (article, main, or content divs)
   */
  findMainContent() {
    // Try common content selectors
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '#content',
      '.post',
      '.entry-content',
      '.article-content'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    // Try to find the largest text-containing element
    return this.findLargestTextElement();
  }

  /**
   * Find element with most text content
   */
  findLargestTextElement() {
    let maxTextLength = 0;
    let bestElement = null;
    
    const candidates = document.querySelectorAll('div, section, article');
    
    candidates.forEach(element => {
      // Skip navigation, headers, footers
      if (element.matches('nav, header, footer, aside')) return;
      
      const textLength = element.textContent.trim().length;
      if (textLength > maxTextLength) {
        maxTextLength = textLength;
        bestElement = element;
      }
    });
    
    return bestElement;
  }

  /**
   * Remove unwanted elements before conversion
   */
  removeUnwantedElements(element) {
    const unwantedSelectors = [
      'script',
      'style',
      'noscript',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.social-share',
      '.comments',
      '[class*="sidebar"]',
      '[class*="widget"]',
      '[id*="cookie"]',
      '[class*="popup"]'
    ];
    
    unwantedSelectors.forEach(selector => {
      element.querySelectorAll(selector).forEach(el => el.remove());
    });
  }

  /**
   * Pre-process DOM to handle browser-specific issues
   */
  preprocessDOM(element) {
    // Handle Chrome's computed styles
    this.handleComputedStyles(element);
    
    // Fix relative URLs
    this.fixRelativeUrls(element);
    
    // Clean up whitespace-only text nodes
    this.cleanWhitespaceNodes(element);
    
    // Handle special cases
    this.handleSpecialCases(element);
  }

  /**
   * Handle computed styles that affect semantics
   */
  handleComputedStyles(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const computed = window.getComputedStyle(node);
      
      // Convert styled elements to semantic ones
      if (computed.fontWeight >= 700 && node.tagName !== 'STRONG' && node.tagName !== 'B') {
        const strong = document.createElement('strong');
        while (node.firstChild) {
          strong.appendChild(node.firstChild);
        }
        node.appendChild(strong);
      }
      
      if (computed.fontStyle === 'italic' && node.tagName !== 'EM' && node.tagName !== 'I') {
        const em = document.createElement('em');
        while (node.firstChild) {
          em.appendChild(node.firstChild);
        }
        node.appendChild(em);
      }
      
      // Mark hidden elements for removal
      if (computed.display === 'none' || computed.visibility === 'hidden') {
        node.setAttribute('data-remove', 'true');
      }
    }
    
    // Remove hidden elements
    element.querySelectorAll('[data-remove="true"]').forEach(el => el.remove());
  }

  /**
   * Fix relative URLs to absolute
   */
  fixRelativeUrls(element) {
    // Fix links
    element.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('//')) {
        link.setAttribute('href', new URL(href, window.location.href).href);
      }
    });
    
    // Fix images
    element.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
        img.setAttribute('src', new URL(src, window.location.href).href);
      }
    });
  }

  /**
   * Clean whitespace-only text nodes
   */
  cleanWhitespaceNodes(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const nodesToRemove = [];
    let node;
    
    while (node = walker.nextNode()) {
      // Keep whitespace in pre elements
      if (node.parentElement.closest('pre')) continue;
      
      // Remove whitespace-only nodes between block elements
      if (/^\s*$/.test(node.textContent)) {
        const prevSibling = node.previousSibling;
        const nextSibling = node.nextSibling;
        
        if (this.isBlockElement(prevSibling) || this.isBlockElement(nextSibling)) {
          nodesToRemove.push(node);
        }
      }
    }
    
    nodesToRemove.forEach(node => node.remove());
  }

  /**
   * Handle special cases specific to Chrome/web content
   */
  handleSpecialCases(element) {
    // Handle SVG icons (convert to text representation)
    element.querySelectorAll('svg').forEach(svg => {
      const title = svg.querySelector('title');
      if (title) {
        svg.replaceWith(document.createTextNode(`[${title.textContent}]`));
      } else {
        svg.remove();
      }
    });
    
    // Handle picture elements
    element.querySelectorAll('picture').forEach(picture => {
      const img = picture.querySelector('img');
      if (img) {
        picture.replaceWith(img);
      }
    });
    
    // Handle figure/figcaption
    element.querySelectorAll('figure').forEach(figure => {
      const img = figure.querySelector('img');
      const caption = figure.querySelector('figcaption');
      
      if (img && caption) {
        // Add caption as title attribute
        img.setAttribute('title', caption.textContent.trim());
      }
    });
  }

  /**
   * Check if element is block-level
   */
  isBlockElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    
    const blockElements = [
      'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'table',
      'thead', 'tbody', 'tr', 'td', 'th', 'hr',
      'form', 'fieldset', 'section', 'article', 'aside',
      'nav', 'header', 'footer', 'main', 'figure'
    ];
    
    return blockElements.includes(element.tagName.toLowerCase());
  }
}

// Message handler for Chrome extension communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const converter = new ChromeExtensionMarkdownConverter();
  
  switch (request.action) {
    case 'convertSelection':
      const selection = converter.convertSelection();
      sendResponse({ markdown: selection });
      break;
      
    case 'convertPage':
      const page = converter.convertPage();
      sendResponse({ markdown: page });
      break;
      
    case 'convertElement':
      const element = document.querySelector(request.selector);
      if (element) {
        const cloned = element.cloneNode(true);
        converter.preprocessDOM(cloned);
        const markdown = converter.parser.convert(cloned);
        sendResponse({ markdown });
      } else {
        sendResponse({ error: 'Element not found' });
      }
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async response
});