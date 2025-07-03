// Simplified content script for Chrome extension
// This runs on every page and handles the conversion

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertToMarkdown') {
    performConversion()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.toString() 
      }));
    return true; // Indicates async response
  }
});

async function performConversion() {
  try {
    // Step 1: Clone the document for Readability processing
    const documentClone = document.cloneNode(true);
    
    // Step 2: Extract article using Readability.js
    const reader = new Readability(documentClone);
    const article = reader.parse();
    
    if (!article) {
      // Fallback to direct conversion if Readability fails
      return directConversion();
    }
    
    // Step 3: Setup Turndown converter
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });
    
    // Add GFM plugin for tables support
    turndownService.use(turndownPluginGfm.gfm);
    
    // Step 4: Convert cleaned HTML to Markdown
    const markdown = turndownService.turndown(article.content);
    
    // Step 5: Build complete markdown document
    const fullMarkdown = buildMarkdownDocument(article, markdown);
    
    return {
      success: true,
      markdown: fullMarkdown,
      title: article.title || document.title,
      author: article.byline,
      length: article.length,
      excerpt: article.excerpt
    };
    
  } catch (error) {
    console.error('Conversion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function directConversion() {
  // Fallback: Convert entire body without Readability
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    turndownService.use(turndownPluginGfm.gfm);
    
    // Remove obvious non-content elements
    const bodyClone = document.body.cloneNode(true);
    const selectorsToRemove = [
      'script', 
      'style', 
      'nav', 
      'header > nav',
      'footer',
      '.advertisement',
      '.sidebar',
      '#comments',
      '.social-share'
    ];
    
    selectorsToRemove.forEach(selector => {
      bodyClone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    const markdown = turndownService.turndown(bodyClone.innerHTML);
    
    return {
      success: true,
      markdown: `# ${document.title}\n\n${markdown}`,
      title: document.title,
      fallbackUsed: true
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Direct conversion failed: ' + error.message
    };
  }
}

function buildMarkdownDocument(article, markdownContent) {
  let doc = '';
  
  // Title
  doc += `# ${article.title}\n\n`;
  
  // Metadata
  const metadata = [];
  if (article.byline) metadata.push(`**Author:** ${article.byline}`);
  if (article.siteName) metadata.push(`**Source:** ${article.siteName}`);
  metadata.push(`**URL:** [${window.location.hostname}](${window.location.href})`);
  
  if (metadata.length > 0) {
    doc += metadata.join(' | ') + '\n\n---\n\n';
  }
  
  // Content
  doc += markdownContent;
  
  return doc;
}

// Keyboard shortcut handler
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + M
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
    e.preventDefault();
    performConversion().then(result => {
      if (result.success) {
        // Send to background script to save or copy
        chrome.runtime.sendMessage({
          action: 'saveMarkdown',
          data: result
        });
      }
    });
  }
});