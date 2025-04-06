(function() {
    // Track active streams
    const activeStreams = new Set();
    
    // Override getUserMedia
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(constraints) {
        const resourceType = constraints.video ? 'Camera' : constraints.audio ? 'Microphone' : 'Unknown';
        
        // Notify content script about access request
        window.postMessage({ 
            type: 'AccessAware', 
            action: 'accessRequest',
            resource: resourceType 
        }, '*');
        
        return originalGetUserMedia(constraints)
            .then(stream => {
                // Generate a unique ID for this stream
                const streamId = Date.now().toString();
                activeStreams.add(streamId);
                
                // Notify that stream is active
                window.postMessage({ 
                    type: 'AccessAware', 
                    action: 'streamActive',
                    resource: resourceType,
                    streamId: streamId
                }, '*');
                
                // Monitor when tracks are ended
                stream.getTracks().forEach(track => {
                    track.addEventListener('ended', () => {
                        // Check if all tracks in this stream have ended
                        const allEnded = stream.getTracks().every(t => t.readyState === 'ended');
                        
                        if (allEnded) {
                            activeStreams.delete(streamId);
                            
                            // Notify that stream has ended
                            window.postMessage({ 
                                type: 'AccessAware', 
                                action: 'streamEnded',
                                resource: resourceType,
                                streamId: streamId
                            }, '*');
                        }
                    });
                });
                
                return stream;
            });
    };
    
    // Report active streams when page is about to unload
    window.addEventListener('beforeunload', () => {
        if (activeStreams.size > 0) {
            window.postMessage({ 
                type: 'AccessAware', 
                action: 'pageClosing',
                activeStreams: Array.from(activeStreams)
            }, '*');
        }
    });
});
