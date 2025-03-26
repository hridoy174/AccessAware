(function() {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(constraints) {
      const resourceType = constraints.video ? 'Camera' : constraints.audio ? 'Microphone' : 'Unknown';
      window.postMessage({ type: 'AccessAware', resource: resourceType }, '*');
      return originalGetUserMedia(constraints);
    };
  })();
  