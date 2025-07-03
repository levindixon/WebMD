// Chrome Extension Example: Using External HTML to Markdown API
// This example demonstrates integration with ConvertAPI and html-to-markdown.com

// manifest.json for Chrome Extension (Manifest V3)
const manifestExample = {
  "manifest_version": 3,
  "name": "HTML to Markdown Converter",
  "version": "1.0",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://api.convertapi.com/*",
    "https://api.html-to-markdown.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
};

// background.js - Service Worker for API calls
// ConvertAPI Implementation
async function convertWithConvertAPI(html, apiKey) {
  try {
    const response = await fetch('https://v2.convertapi.com/convert/html/to/md', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        Parameters: [
          {
            Name: 'File',
            FileValue: {
              Name: 'input.html',
              Data: btoa(html) // Base64 encode the HTML
            }
          },
          {
            Name: 'GitHubFlavored',
            Value: true
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    // ConvertAPI returns base64 encoded markdown
    return atob(result.Files[0].FileData);
  } catch (error) {
    console.error('ConvertAPI error:', error);
    throw error;
  }
}

// html-to-markdown.com Implementation
async function convertWithHtmlToMarkdown(html, apiKey) {
  try {
    const response = await fetch('https://api.html-to-markdown.com/v1/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        html: html,
        options: {
          // Enable GitHub Flavored Markdown features
          gfm: true,
          // Handle code blocks properly
          codeBlockStyle: 'fenced',
          // Preserve semantic HTML structure
          preserveSemanticStructure: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.markdown;
  } catch (error) {
    console.error('html-to-markdown.com error:', error);
    throw error;
  }
}

// Message handler in background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertToMarkdown') {
    const { html, service, apiKey } = request;
    
    // Choose conversion service
    let conversionPromise;
    switch (service) {
      case 'convertapi':
        conversionPromise = convertWithConvertAPI(html, apiKey);
        break;
      case 'htmltomarkdown':
        conversionPromise = convertWithHtmlToMarkdown(html, apiKey);
        break;
      default:
        sendResponse({ error: 'Unknown service' });
        return;
    }

    // Handle async response
    conversionPromise
      .then(markdown => sendResponse({ success: true, markdown }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    // Keep message channel open for async response
    return true;
  }
});

// content.js - Content script that communicates with background
function getSelectedHTML() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const container = document.createElement('div');
    for (let i = 0; i < selection.rangeCount; i++) {
      container.appendChild(selection.getRangeAt(i).cloneContents());
    }
    return container.innerHTML;
  }
  return document.documentElement.outerHTML;
}

// Send HTML to background for conversion
async function convertSelection() {
  const html = getSelectedHTML();
  
  // Get API settings from storage
  const settings = await chrome.storage.sync.get(['apiService', 'apiKey']);
  
  chrome.runtime.sendMessage({
    action: 'convertToMarkdown',
    html: html,
    service: settings.apiService || 'htmltomarkdown',
    apiKey: settings.apiKey
  }, response => {
    if (response.success) {
      console.log('Converted markdown:', response.markdown);
      // Handle the markdown result (e.g., copy to clipboard, display, etc.)
    } else {
      console.error('Conversion failed:', response.error);
    }
  });
}

// Example with error handling and retry logic
async function convertWithRetry(html, service, apiKey, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'convertToMarkdown',
          html: html,
          service: service,
          apiKey: apiKey
        }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response.success) {
            resolve(response.markdown);
          } else {
            reject(new Error(response.error));
          }
        });
      });
      
      return response;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed:`, error);
      
      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

// Privacy-conscious implementation with local caching
const conversionCache = new Map();

async function convertWithCache(html, service, apiKey) {
  // Create cache key from HTML hash
  const cacheKey = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(html + service)
  ).then(buffer => 
    Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  );
  
  // Check cache first
  if (conversionCache.has(cacheKey)) {
    return conversionCache.get(cacheKey);
  }
  
  // Convert and cache result
  const markdown = await convertWithRetry(html, service, apiKey);
  conversionCache.set(cacheKey, markdown);
  
  // Limit cache size
  if (conversionCache.size > 100) {
    const firstKey = conversionCache.keys().next().value;
    conversionCache.delete(firstKey);
  }
  
  return markdown;
}