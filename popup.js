/**
 * WebMD Popup Script
 * 
 * Manages the extension popup interface, including settings persistence,
 * user interactions, and communication with content scripts. This script
 * handles the main UI for manual conversions and configuration.
 */

document.addEventListener('DOMContentLoaded', () => {
  /**
   * Display the correct keyboard shortcut based on user's operating system
   * Mac uses Cmd key, Windows/Linux use Ctrl key
   */
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  document.getElementById('shortcut').textContent = isMac ? 'Cmd+Shift+K' : 'Ctrl+Shift+K';
  
  /**
   * Load user preferences from Chrome sync storage
   * Settings persist across browser sessions and sync across devices
   */
  chrome.storage.sync.get(['useReadability', 'includeMetadata', 'autoCopy'], (items) => {
    document.getElementById('useReadability').checked = items.useReadability !== false;
    document.getElementById('includeMetadata').checked = items.includeMetadata !== false;
    document.getElementById('autoCopy').checked = items.autoCopy || false;
  });
  
  /**
   * Attach change listeners to all checkboxes for auto-saving settings
   * Changes are immediately persisted to Chrome sync storage
   */
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      chrome.storage.sync.set({
        useReadability: document.getElementById('useReadability').checked,
        includeMetadata: document.getElementById('includeMetadata').checked,
        autoCopy: document.getElementById('autoCopy').checked
      });
    });
  });
  
  /**
   * Main conversion button click handler
   * Injects necessary scripts and triggers the conversion process
   */
  document.getElementById('convert').addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      /**
       * Programmatically inject content scripts and dependencies
       * This ensures scripts are available even on special pages where
       * declarative injection might fail
       */
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
        // Expected when scripts are already injected - not an error
        // This commonly happens on pages where scripts were previously injected
      }
      
      // Send conversion request to the content script
      // The content script will process the page and return the Markdown
      chrome.tabs.sendMessage(activeTab.id, { action: 'convertToMarkdown' }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          return;
        }
        
        if (response && response.success) {
          chrome.runtime.sendMessage({
            action: 'openMarkdownTab',
            data: response.data
          });
          window.close();
        } else {
          showStatus('Conversion failed', 'error');
        }
      });
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
    }
  });
});

/**
 * Displays temporary status messages in the popup UI
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'success' or 'error' (affects color)
 */
function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = type === 'error' ? '#dc3545' : '#28a745';
  
  // Auto-clear the status message after 3 seconds
  setTimeout(() => {
    status.textContent = '';
  }, 3000);
}