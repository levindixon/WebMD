/**
 * WebMD Background Service Worker
 * 
 * Handles Chrome extension commands, keyboard shortcuts, and new tab creation
 * for displaying converted Markdown content. This service worker runs in the
 * background and coordinates between the popup, content scripts, and browser.
 */

/**
 * Chrome Commands API listener for keyboard shortcuts
 * Handles the global keyboard shortcut (Cmd+Shift+K / Ctrl+Shift+K)
 * for converting the current page to Markdown
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'convert-to-markdown') {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      // Programmatically inject required scripts into the active tab
      // This ensures content scripts are available even on pages loaded
      // before the extension was installed or on restricted pages
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: [
            'lib/readability.js',
            'lib/turndown.js',
            'lib/turndown-plugin-gfm.js',
            'content.js'
          ]
        });
      } catch (e) {
        // Scripts might already be injected from manifest or previous injection
        // This is expected behavior and not an error condition
      }
      
      // Now send the message
      chrome.tabs.sendMessage(activeTab.id, { action: 'convertToMarkdown' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          createMarkdownTab(response.data);
        } else {
          console.error('Conversion failed:', response?.error);
        }
      });
    } catch (error) {
      console.error('Command error:', error);
    }
  }
});

/**
 * Runtime message listener for communication with content scripts and popup
 * Handles requests to open new tabs with converted Markdown content
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openMarkdownTab') {
    createMarkdownTab(request.data);
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Creates a new browser tab displaying the converted Markdown content
 * Generates a complete HTML page with styling and interactive features
 * @param {Object} data - Object containing markdown string and metadata
 * @param {string} data.markdown - The converted Markdown content
 * @param {Object} data.metadata - Metadata about the source page
 */
function createMarkdownTab(data) {
  const { markdown, metadata } = data;
  
  // Generate a complete HTML document for displaying the Markdown
  // This creates a self-contained page with embedded styles and scripts
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Output</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .copy-btn {
      background: #007bff;
      color: white;
    }
    
    .copy-btn:hover {
      background: #0056b3;
    }
    
    .copy-btn.copied {
      background: #28a745;
    }
    
    .download-btn {
      background: #6c757d;
      color: white;
    }
    
    .download-btn:hover {
      background: #545b62;
    }
    
    .markdown-content {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .status {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    
    .status.show {
      opacity: 1;
    }
    
    .metadata {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Markdown Output</h1>
      <div class="actions">
        <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
        <button class="download-btn" onclick="downloadMarkdown()">Download</button>
      </div>
    </div>
    
    <div class="metadata">
      ${metadata.title ? `<div>Source: ${metadata.title}</div>` : ''}
      ${metadata.author ? `<div>Author: ${metadata.author}</div>` : ''}
    </div>
    
    <div class="markdown-content" id="markdown-content">${escapeHtml(markdown)}</div>
  </div>
  
  <div class="status" id="status">Copied to clipboard!</div>
  
  <script>
    const markdownContent = ${JSON.stringify(markdown)};
    
    function copyToClipboard() {
      navigator.clipboard.writeText(markdownContent).then(() => {
        const btn = document.querySelector('.copy-btn');
        const status = document.getElementById('status');
        
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        status.classList.add('show');
        
        setTimeout(() => {
          btn.textContent = 'Copy to Clipboard';
          btn.classList.remove('copied');
          status.classList.remove('show');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
      });
    }
    
    function downloadMarkdown() {
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'page-content.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Auto-copy on load (optional)
    // copyToClipboard();
  </script>
</body>
</html>`;

  // Create a data URL from the HTML content
  // This allows us to open a fully-styled page without hosting files
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
  
  // Open the generated page in a new browser tab
  chrome.tabs.create({ url: dataUrl });
}

/**
 * Escapes HTML special characters to prevent XSS when displaying content
 * @param {string} text - Raw text that may contain HTML characters
 * @returns {string} Text with HTML characters properly escaped
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}