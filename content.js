// Explicitly inject your external file
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen explicitly to messages from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type && event.data.type === 'AccessAware') {
    chrome.runtime.sendMessage({
      action: 'logAccess',
      resource: event.data.resource
    }, (response) => {
      if (chrome.runtime.lastError) {
        alert(`❌ Runtime error (content): ${chrome.runtime.lastError.message}`);
        console.error("❌ Runtime error (content):", chrome.runtime.lastError.message);
      } else {
        alert(`✅ Message received explicitly: ${JSON.stringify(response)}`);
        console.log("✅ Message received explicitly:", response);
      }
    });
  }
});
