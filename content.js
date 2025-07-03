/**
 * WebMD Content Script - HTML to Markdown Converter
 * 
 * This content script handles the core conversion logic for transforming
 * web pages into clean Markdown format. It uses Mozilla's Readability.js
 * for intelligent article extraction and Turndown.js for HTML-to-Markdown
 * conversion.
 */
(function() {
  'use strict';

  /**
   * Initialize Turndown service with GitHub Flavored Markdown settings
   * @type {TurndownService}
   */
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    preformattedCode: true
  });

  // Enable GitHub Flavored Markdown plugin for enhanced formatting support
  // This adds support for tables, strikethrough text, and task lists
  turndownService.use(turndownPluginGfm.gfm);

  /**
   * Custom Turndown rule for handling code blocks with language hints
   * Preserves syntax highlighting information from class attributes
   */
  turndownService.addRule('fencedCodeBlock', {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node, options) {
      const className = node.firstChild.getAttribute('class') || '';
      const language = className.match(/language-(\S+)/);
      const fence = '```';
      const fenceLanguage = language ? language[1] : '';
      
      return (
        '\n\n' + fence + fenceLanguage + '\n' +
        node.firstChild.textContent +
        '\n' + fence + '\n\n'
      );
    }
  });

  /**
   * Attempts to extract main article content using Mozilla's Readability
   * @returns {Object|null} Article object with content and metadata, or null if extraction fails
   */
  function extractArticleContent() {
    try {
      // Clone the document to avoid modifying the original
      const documentClone = document.cloneNode(true);
      const reader = new Readability(documentClone);
      const article = reader.parse();
      
      if (article && article.content) {
        return {
          title: article.title,
          author: article.byline,
          content: article.content,
          excerpt: article.excerpt,
          siteName: article.siteName,
          isArticle: true
        };
      }
    } catch (error) {
      console.log('Readability extraction failed:', error);
    }
    return null;
  }

  /**
   * Main conversion function that transforms the current page to Markdown
   * Uses Readability for article extraction when possible, falls back to
   * full page conversion for non-article content
   * @returns {Object} Object containing markdown string and metadata
   */
  function convertToMarkdown() {
    let markdown = '';
    let metadata = {};
    
    // First, try to extract article content with Readability
    const article = extractArticleContent();
    
    if (article && article.isArticle) {
      // Article successfully extracted - use Readability's clean content
      // Collect all available metadata for frontmatter
      metadata = {
        title: article.title,
        author: article.author,
        siteName: article.siteName,
        excerpt: article.excerpt
      };
      
      // Add metadata as YAML frontmatter
      markdown = '---\n';
      if (metadata.title) markdown += `title: "${metadata.title}"\n`;
      if (metadata.author) markdown += `author: "${metadata.author}"\n`;
      if (metadata.siteName) markdown += `site: "${metadata.siteName}"\n`;
      markdown += `url: "${window.location.href}"\n`;
      markdown += `date: "${new Date().toISOString()}"\n`;
      markdown += '---\n\n';
      
      // Add title as H1 if it exists
      if (metadata.title) {
        markdown += `# ${metadata.title}\n\n`;
      }
      
      // Convert the clean article content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.content;
      markdown += turndownService.turndown(tempDiv);
      
    } else {
      // No article detected - fall back to full page conversion
      // Try to find main content area using common semantic selectors
      // Listed in order of specificity and likelihood of containing main content
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '#content',
        '.content',
        '#main',
        '.main'
      ];
      
      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = document.querySelector(selector);
        if (contentElement) break;
      }
      
      // If no main content found, use body
      if (!contentElement) {
        contentElement = document.body;
      }
      
      // Clone the content element to avoid modifying the actual page DOM
      const contentClone = contentElement.cloneNode(true);
      
      // Remove non-content elements that would create noise in Markdown
      // This includes scripts, styles, and noscript tags
      const scripts = contentClone.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());
      
      // Remove visually hidden elements that shouldn't appear in text output
      // Targets inline styles and hidden attribute
      const hidden = contentClone.querySelectorAll('[style*="display:none"], [style*="display: none"], [hidden]');
      hidden.forEach(el => el.remove());
      
      // Add basic metadata
      markdown = '---\n';
      markdown += `title: "${document.title}"\n`;
      markdown += `url: "${window.location.href}"\n`;
      markdown += `date: "${new Date().toISOString()}"\n`;
      markdown += '---\n\n';
      
      // Add page title
      markdown += `# ${document.title}\n\n`;
      
      // Convert content
      markdown += turndownService.turndown(contentClone);
    }
    
    return {
      markdown: markdown,
      metadata: metadata
    };
  }

  /**
   * Message listener for conversion requests from popup or background script
   * Handles the 'convertToMarkdown' action and sends back the result
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'convertToMarkdown') {
      try {
        const result = convertToMarkdown();
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error('Conversion error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    // Return true to indicate we'll send response asynchronously
    // This keeps the message channel open for sendResponse
    return true;
  });

  /**
   * Keyboard event listener for direct shortcut handling (legacy fallback)
   * Note: Primary keyboard handling is done via Chrome Commands API in background.js
   * This remains for backward compatibility
   */
  document.addEventListener('keydown', (e) => {
    // Cmd+M+D on Mac, Ctrl+Shift+M on others
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const correctModifiers = isMac 
      ? (e.metaKey && e.key === 'd' && e.code === 'KeyD') 
      : (e.ctrlKey && e.shiftKey && e.key === 'M');
      
    if (correctModifiers) {
      e.preventDefault();
      const result = convertToMarkdown();
      chrome.runtime.sendMessage({
        action: 'openMarkdownTab',
        data: result
      });
    }
  });
})();