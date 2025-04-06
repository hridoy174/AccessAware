document.addEventListener('DOMContentLoaded', () => {
    // Load recent activities
    chrome.storage.local.get(['logs'], function(result) {
        const container = document.getElementById('recent-activities');
        container.innerHTML = '';
        const logs = result.logs || [];
        if(logs.length === 0){
            container.textContent = "No recent activity recorded.";
        } else {
            // Get 5 most recent logs
            logs.slice(-5).reverse().forEach(log => {
                let div = document.createElement('div');
                div.className = 'activity-item';
                
                // Add status indicator
                let statusClass = log.trusted ? 'trusted' : log.blocked ? 'blocked' : '';
                
                div.innerHTML = `
                    <span class="domain ${statusClass}">${log.url}</span>
                    <span class="resource">${log.resource}</span>
                    <span class="time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                `;
                container.appendChild(div);
            });
        }
    });
    
    // Update active status indicators with improved error handling
    function updateActiveStatus() {
        chrome.runtime.sendMessage({ action: 'getActiveStreams' }, (response) => {
            if (chrome.runtime.lastError) {
                return;
            }
            
            const cameraStatus = document.querySelector('#camera-status .status-value');
            const micStatus = document.querySelector('#microphone-status .status-value');
            const cameraIndicator = document.querySelector('#camera-status .status-indicator');
            const micIndicator = document.querySelector('#microphone-status .status-indicator');
            
            if (!cameraStatus || !micStatus) {
                return;
            }
            
            // Reset indicators
            cameraStatus.textContent = 'Inactive';
            micStatus.textContent = 'Inactive';
            cameraIndicator.className = 'status-indicator';
            micIndicator.className = 'status-indicator';
            
            if (response && response.activeStreams) {
                let cameraActive = false;
                let micActive = false;
                let activeDomains = new Set();
                
                // Check each domain for active streams
                Object.keys(response.activeStreams).forEach(domain => {
                    const streamsByDomain = response.activeStreams[domain];
                    
                    // Only consider non-empty stream objects
                    if (Object.keys(streamsByDomain).length > 0) {
                        Object.entries(streamsByDomain).forEach(([streamId, stream]) => {
                            // Verify the stream object has valid properties
                            if (stream && stream.resource) {
                                if (stream.resource === 'Camera') {
                                    cameraActive = true;
                                    activeDomains.add(domain);
                                } else if (stream.resource === 'Microphone') {
                                    micActive = true;
                                    activeDomains.add(domain);
                                }
                            }
                        });
                    }
                });
                
                // Update status display only if there are actual active domains
                if (activeDomains.size > 0) {
                    const domainList = Array.from(activeDomains).join(', ');
                    
                    if (cameraActive) {
                        cameraStatus.textContent = `Active on ${domainList}`;
                        cameraIndicator.classList.add('active');
                    }
                    
                    if (micActive) {
                        micStatus.textContent = `Active on ${domainList}`;
                        micIndicator.classList.add('active');
                    }
                }
            }
        });
    }
    
    // Update active status when popup opens
    updateActiveStatus();
    
    // Set up refresh interval while popup is open - reduced frequency to decrease console spam
    const statusInterval = setInterval(updateActiveStatus, 5000);
    
    // Clean up when popup closes - use pagehide instead of unload
    window.addEventListener('pagehide', () => {
        clearInterval(statusInterval);
    });
  
    // Navigation buttons
    document.getElementById('dashboard-btn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'dashboard.html' });
    });
    
    document.getElementById('options-btn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
