// Chrome Extension Implementation: Readability.js + Turndown Pipeline
// This example shows a complete implementation for a Chrome extension

// manifest.json dependencies needed:
// - @mozilla/readability
// - turndown
// - turndown-plugin-gfm (for GitHub Flavored Markdown support)

import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Configuration options
const READABILITY_OPTIONS = {
  // Minimum length for article extraction
  charThreshold: 500,
  
  // Number of top candidates to consider
  nbTopCandidates: 5,
  
  // Maximum elements to parse (0 = no limit)
  maxElemsToParse: 0,
  
  // Keep classes for specific elements (useful for code blocks)
  keepClasses: ['language-*', 'hljs', 'prettyprint'],
  
  // Debug mode
  debug: false
};

const TURNDOWN_OPTIONS = {
  // Use fenced code blocks ```
  codeBlockStyle: 'fenced',
  
  // Heading style: atx (#) or setext (underline)
  headingStyle: 'atx',
  
  // Horizontal rule style
  hr: '---',
  
  // Bullet list marker
  bulletListMarker: '-',
  
  // Strong/emphasis delimiters
  strongDelimiter: '**',
  emDelimiter: '*',
  
  // Link style
  linkStyle: 'inlined',
  
  // Link reference style
  linkReferenceStyle: 'full',
  
  // Preserve line breaks
  br: '  ',
  
  // Blank replacement
  blankReplacement: function (content, node) {
    return node.isBlock ? '\n\n' : '';
  },
  
  // Keep replacement
  keepReplacement: function (content, node) {
    return node.isBlock ? '\n\n' + content + '\n\n' : content;
  },
  
  // Default replacement
  defaultReplacement: function (content, node) {
    return node.isBlock ? '\n\n' + content + '\n\n' : content;
  }
};

// Initialize Turndown with plugins
function initializeTurndown() {
  const turndownService = new TurndownService(TURNDOWN_OPTIONS);
  
  // Add GitHub Flavored Markdown support (tables, strikethrough, etc.)
  turndownService.use(gfm);
  
  // Custom rule for preserving code language hints
  turndownService.addRule('preserveCodeLanguage', {
    filter: function (node) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node) {
      const codeNode = node.firstChild;
      const language = extractLanguage(codeNode);
      const fence = '```';
      
      return (
        '\n\n' + fence + language + '\n' +
        codeNode.textContent +
        '\n' + fence + '\n\n'
      );
    }
  });
  
  // Custom rule for better image handling
  turndownService.addRule('improvedImages', {
    filter: 'img',
    replacement: function (content, node) {
      const alt = cleanAttribute(node.getAttribute('alt'));
      const src = node.getAttribute('src') || '';
      const title = cleanAttribute(node.getAttribute('title'));
      
      if (!src) return '';
      
      let markdown = '![' + alt + '](' + src;
      if (title) markdown += ' "' + title + '"';
      markdown += ')';
      
      // Add image caption if available
      const figcaption = node.closest('figure')?.querySelector('figcaption');
      if (figcaption) {
        markdown += '\n*' + figcaption.textContent.trim() + '*';
      }
      
      return markdown;
    }
  });
  
  return turndownService;
}

// Helper function to extract language from code blocks
function extractLanguage(codeNode) {
  const className = codeNode.className || '';
  const languageMatch = className.match(/language-(\w+)/);
  
  if (languageMatch) {
    return languageMatch[1];
  }
  
  // Check data attributes
  const dataLang = codeNode.getAttribute('data-lang');
  if (dataLang) {
    return dataLang;
  }
  
  // Common class patterns
  const commonPatterns = {
    'javascript': ['js', 'javascript', 'ecmascript'],
    'typescript': ['ts', 'typescript'],
    'python': ['py', 'python'],
    'css': ['css', 'scss', 'sass', 'less'],
    'html': ['html', 'xml', 'xhtml'],
    'json': ['json'],
    'bash': ['bash', 'sh', 'shell'],
    'sql': ['sql'],
    'markdown': ['md', 'markdown']
  };
  
  for (const [lang, patterns] of Object.entries(commonPatterns)) {
    if (patterns.some(pattern => className.includes(pattern))) {
      return lang;
    }
  }
  
  return '';
}

// Helper function to clean attributes
function cleanAttribute(attr) {
  return (attr || '').replace(/(\n+\s*)+/g, '\n');
}

// Main conversion function
async function convertToMarkdown(options = {}) {
  try {
    // Step 1: Get the current page's HTML
    const documentClone = document.cloneNode(true);
    
    // Step 2: Run Readability.js to extract article content
    const article = new Readability(documentClone, READABILITY_OPTIONS).parse();
    
    if (!article) {
      throw new Error('Failed to extract article content. This page might not contain article-like content.');
    }
    
    // Step 3: Create a temporary DOM element with the cleaned content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;
    
    // Step 4: Optional - Additional cleaning before conversion
    if (options.additionalCleaning) {
      cleanContentBeforeConversion(tempDiv);
    }
    
    // Step 5: Convert to Markdown using Turndown
    const turndownService = initializeTurndown();
    const markdown = turndownService.turndown(tempDiv.innerHTML);
    
    // Step 6: Build the final markdown with metadata
    const finalMarkdown = buildFinalMarkdown(article, markdown, options);
    
    return {
      success: true,
      markdown: finalMarkdown,
      metadata: {
        title: article.title,
        author: article.byline,
        length: article.length,
        excerpt: article.excerpt,
        siteName: article.siteName,
        publishedTime: article.publishedTime
      }
    };
    
  } catch (error) {
    console.error('Conversion error:', error);
    
    // Fallback: Try direct conversion without Readability
    if (options.fallbackToDirect) {
      return fallbackDirectConversion();
    }
    
    return {
      success: false,
      error: error.message,
      markdown: null
    };
  }
}

// Additional cleaning function
function cleanContentBeforeConversion(element) {
  // Remove script tags
  element.querySelectorAll('script').forEach(el => el.remove());
  
  // Remove style tags
  element.querySelectorAll('style').forEach(el => el.remove());
  
  // Remove hidden elements
  element.querySelectorAll('[style*="display: none"]').forEach(el => el.remove());
  element.querySelectorAll('[hidden]').forEach(el => el.remove());
  
  // Remove common ad/tracking elements
  element.querySelectorAll('.advertisement, .ads, #ads, .tracking-pixel').forEach(el => el.remove());
  
  // Clean up empty paragraphs
  element.querySelectorAll('p').forEach(p => {
    if (!p.textContent.trim() && !p.querySelector('img')) {
      p.remove();
    }
  });
}

// Build final markdown with metadata
function buildFinalMarkdown(article, markdown, options) {
  let finalMarkdown = '';
  
  // Add title
  if (article.title && !markdown.startsWith('# ')) {
    finalMarkdown += `# ${article.title}\n\n`;
  }
  
  // Add metadata if requested
  if (options.includeMetadata) {
    const metadata = [];
    
    if (article.byline) {
      metadata.push(`**Author:** ${article.byline}`);
    }
    
    if (article.publishedTime) {
      metadata.push(`**Published:** ${new Date(article.publishedTime).toLocaleDateString()}`);
    }
    
    if (article.siteName) {
      metadata.push(`**Source:** ${article.siteName}`);
    }
    
    if (metadata.length > 0) {
      finalMarkdown += metadata.join(' | ') + '\n\n---\n\n';
    }
  }
  
  // Add main content
  finalMarkdown += markdown;
  
  // Add source URL if requested
  if (options.includeSourceUrl) {
    finalMarkdown += `\n\n---\n\n*Source: [${window.location.href}](${window.location.href})*`;
  }
  
  return finalMarkdown;
}

// Fallback function for direct conversion
function fallbackDirectConversion() {
  try {
    const turndownService = initializeTurndown();
    const markdown = turndownService.turndown(document.body.innerHTML);
    
    return {
      success: true,
      markdown: markdown,
      metadata: {
        title: document.title,
        url: window.location.href
      },
      fallbackUsed: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Both Readability and direct conversion failed: ' + error.message,
      markdown: null
    };
  }
}

// Chrome Extension Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertToMarkdown') {
    convertToMarkdown(request.options || {})
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    
    // Return true to indicate async response
    return true;
  }
});

// Example usage in popup or content script
async function handleConvertButton() {
  const options = {
    includeMetadata: true,
    includeSourceUrl: true,
    additionalCleaning: true,
    fallbackToDirect: true
  };
  
  const result = await convertToMarkdown(options);
  
  if (result.success) {
    // Success - do something with the markdown
    console.log('Conversion successful!');
    console.log('Title:', result.metadata.title);
    console.log('Length:', result.metadata.length);
    
    // Copy to clipboard
    await navigator.clipboard.writeText(result.markdown);
    
    // Or save to file
    // saveMarkdownFile(result.markdown, result.metadata.title);
  } else {
    // Handle error
    console.error('Conversion failed:', result.error);
    alert('Failed to convert page: ' + result.error);
  }
}

// Export for use in other modules
export { convertToMarkdown, initializeTurndown };