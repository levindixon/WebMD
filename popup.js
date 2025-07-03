// Popup script for extension UI

document.addEventListener('DOMContentLoaded', () => {
  // Set platform-specific shortcut display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  document.getElementById('shortcut').textContent = isMac ? 'Cmd+Shift+K' : 'Ctrl+Shift+K';
  
  // Load saved settings
  chrome.storage.sync.get(['useReadability', 'includeMetadata', 'autoCopy'], (items) => {
    document.getElementById('useReadability').checked = items.useReadability !== false;
    document.getElementById('includeMetadata').checked = items.includeMetadata !== false;
    document.getElementById('autoCopy').checked = items.autoCopy || false;
  });
  
  // Save settings on change
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      chrome.storage.sync.set({
        useReadability: document.getElementById('useReadability').checked,
        includeMetadata: document.getElementById('includeMetadata').checked,
        autoCopy: document.getElementById('autoCopy').checked
      });
    });
  });
  
  // Convert button
  document.getElementById('convert').addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      // First, inject the required scripts if they're not already loaded
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
        // Scripts might already be injected, that's okay
        console.log('Script injection result:', e);
      }
      
      // Now send the message
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

function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = type === 'error' ? '#dc3545' : '#28a745';
  
  setTimeout(() => {
    status.textContent = '';
  }, 3000);
}