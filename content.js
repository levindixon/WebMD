// Content script for HTML to Markdown conversion
(function() {
  'use strict';

  // Initialize Turndown with GitHub Flavored Markdown
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

  // Enable GFM plugin for tables, strikethrough, and task lists
  turndownService.use(turndownPluginGfm.gfm);

  // Custom rule for preserving code language hints
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

  // Try to extract article content using Readability
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

  // Convert HTML to Markdown
  function convertToMarkdown() {
    let markdown = '';
    let metadata = {};
    
    // First, try to extract article content with Readability
    const article = extractArticleContent();
    
    if (article && article.isArticle) {
      // Article detected - use clean extracted content
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
      // Try to find main content area
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
      
      // Clone to avoid modifying the page
      const contentClone = contentElement.cloneNode(true);
      
      // Remove script and style tags
      const scripts = contentClone.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());
      
      // Remove hidden elements
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

  // Listen for keyboard command
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
    return true; // Keep message channel open for async response
  });

  // Also listen for direct keyboard shortcut (backup method)
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