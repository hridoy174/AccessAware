document.addEventListener('DOMContentLoaded', () => {
    // Load recent activities
    browser.storage.local.get(['logs']).then(result => {
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
    }).catch(error => {
        console.error("Error loading logs:", error);
    });
    
    // Update active status indicators
    function updateActiveStatus() {
        browser.runtime.sendMessage({ action: 'getActiveStreams' }).then(response => {
            const cameraStatus = document.querySelector('#camera-status .status-value');
            const micStatus = document.querySelector('#microphone-status .status-value');
            const cameraIndicator = document.querySelector('#camera-status .status-indicator');
            const micIndicator = document.querySelector('#microphone-status .status-indicator');
            
            if (!cameraStatus || !micStatus) return;
            
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
                    Object.values(response.activeStreams[domain]).forEach(stream => {
                        if (stream.resource === 'Camera') {
                            cameraActive = true;
                            activeDomains.add(domain);
                        } else if (stream.resource === 'Microphone') {
                            micActive = true;
                            activeDomains.add(domain);
                        }
                    });
                });
                
                // Update status display
                if (cameraActive) {
                    cameraStatus.textContent = `Active on ${Array.from(activeDomains).join(', ')}`;
                    cameraIndicator.classList.add('active');
                }
                
                if (micActive) {
                    micStatus.textContent = `Active on ${Array.from(activeDomains).join(', ')}`;
                    micIndicator.classList.add('active');
                }
            }
        }).catch(error => {
            console.error('Error getting active streams:', error);
        });
    }
    
    // Update active status when popup opens
    updateActiveStatus();
    
    // Set up refresh interval while popup is open
    const statusInterval = setInterval(updateActiveStatus, 3000);
    
    // Clean up when popup closes - use pagehide instead of unload
    window.addEventListener('pagehide', () => {
        clearInterval(statusInterval);
    });
  
    // Navigation buttons
    document.getElementById('dashboard-btn').addEventListener('click', () => {
        browser.tabs.create({ url: 'dashboard.html' });
    });
    
    document.getElementById('options-btn').addEventListener('click', () => {
        browser.runtime.openOptionsPage();
    });
});
