// Explicitly inject your external file
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen explicitly to messages from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type && event.data.type === 'AccessAware') {
    
    switch(event.data.action) {
      case 'accessRequest':
        // Handle initial access request (existing functionality)
        chrome.runtime.sendMessage({
          action: 'logAccess',
          resource: event.data.resource
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Runtime error (content):", chrome.runtime.lastError.message);
          } else {
            console.log("✅ Access request logged:", response);
          }
        });
        break;
        
      case 'streamActive':
        // Handle active stream notification
        chrome.runtime.sendMessage({
          action: 'streamActive',
          resource: event.data.resource,
          streamId: event.data.streamId
        });
        break;
        
      case 'streamEnded':
        // Handle stream ended notification
        chrome.runtime.sendMessage({
          action: 'streamEnded',
          resource: event.data.resource,
          streamId: event.data.streamId
        });
        break;

      case 'pageClosing':
        // Handle page unload with active streams
        chrome.runtime.sendMessage({
          action: 'pageClosing',
          activeStreams: event.data.activeStreams
        });
        break;
    }
  }
});
