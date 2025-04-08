// Explicitly inject your external file
const script = document.createElement('script');
script.src = browser.runtime.getURL('inject.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen explicitly to messages from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type && event.data.type === 'AccessAware') {
    
    switch(event.data.action) {
      case 'accessRequest':
        // Handle initial access request (using promises instead of callbacks)
        browser.runtime.sendMessage({
          action: 'logAccess',
          resource: event.data.resource
        }).then(response => {
          console.log("✅ Access request logged:", response);
        }).catch(error => {
          console.error("❌ Runtime error (content):", error);
        });
        break;
        
      case 'streamActive':
        // Handle active stream notification (using promises)
        browser.runtime.sendMessage({
          action: 'streamActive',
          resource: event.data.resource,
          streamId: event.data.streamId
        }).then(response => {
          console.log("✅ Stream active logged:", response);
        }).catch(error => {
          console.error("❌ Runtime error (content):", error);
        });
        break;
        
      case 'streamEnded':
        // Handle stream ended notification (using promises)
        browser.runtime.sendMessage({
          action: 'streamEnded',
          resource: event.data.resource,
          streamId: event.data.streamId
        }).then(response => {
          console.log("✅ Stream ended logged:", response);
        }).catch(error => {
          console.error("❌ Runtime error (content):", error);
        });
        break;
        
      case 'pageClosing':
        // Handle page unload with active streams (using promises)
        browser.runtime.sendMessage({
          action: 'pageClosing',
          activeStreams: event.data.activeStreams
        }).then(response => {
          console.log("✅ Page closing logged:", response);
        }).catch(error => {
          console.error("❌ Runtime error (content):", error);
        });
        break;
    }
  }
});
