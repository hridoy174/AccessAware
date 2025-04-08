// Track active streams
const activeStreams = {};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'logAccess') {
        browser.storage.local.get({ 
            logs: [], 
            notificationsEnabled: true,
            trustedSites: [],
            blockedSites: []
        }).then((data) => {
            const logs = data.logs;
            const domain = new URL(sender.tab.url).hostname;
            
            // Check if site is trusted - don't notify for trusted sites
            if (data.trustedSites && data.trustedSites.some(site => domain.includes(site))) {
                // Still log, but don't notify
                logs.push({
                    url: domain,
                    resource: request.resource,
                    timestamp: new Date().toISOString(),
                    trusted: true
                });
                
                browser.storage.local.set({ logs }).then(() => {
                    console.log('✅ Log saved for trusted site:', domain);
                });
                
                sendResponse({ status: 'trusted-site' });
                return;
            }
            
            // Check if site is blocked
            if (data.blockedSites && data.blockedSites.some(site => domain.includes(site))) {
                // Log the blocked attempt
                logs.push({
                    url: domain,
                    resource: request.resource,
                    timestamp: new Date().toISOString(),
                    blocked: true
                });
                
                browser.storage.local.set({ logs }).then(() => {
                    console.log('⛔ Blocked access attempt logged for:', domain);
                });
                
                // Always notify for blocked attempts
                browser.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/128.png',
                    title: 'AccessAware - Access Blocked',
                    message: `Blocked ${domain} from accessing your ${request.resource}!`,
                    priority: 2
                });
                
                sendResponse({ status: 'blocked-site' });
                return;
            }
            
            // Avoid duplicate notifications/logs within a short time (optional enhancement)
            const lastLog = logs[logs.length - 1];
            if (lastLog && lastLog.url === domain && lastLog.resource === request.resource &&
                (new Date() - new Date(lastLog.timestamp)) < 60000) { // 1 minute gap
                sendResponse({ status: 'ignored-duplicate' });
                return;
            }

            logs.push({
                url: domain,
                resource: request.resource,
                timestamp: new Date().toISOString()
            });

            browser.storage.local.set({ logs }).then(() => {
                console.log('✅ Log saved successfully:', logs);
            });

            if (data.notificationsEnabled) {
                browser.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/128.png',
                    title: 'AccessAware Alert',
                    message: `${domain} is accessing your ${request.resource}!`,
                    priority: 2
                });
            }

            sendResponse({ status: 'received' });
        }).catch(error => {
            console.error("Error handling logAccess:", error);
        });
        
        return true; // Important for async response
    }
    
    // Handle getActiveStreams request from popup
    if (request.action === 'getActiveStreams') {
        sendResponse({ activeStreams });
        return true;
    }
    
    // Track active streams
    if (request.action === 'streamActive') {
        const domain = new URL(sender.tab.url).hostname;
        
        // Store active stream info
        if (!activeStreams[domain]) {
            activeStreams[domain] = {};
        }
        
        activeStreams[domain][request.streamId] = {
            resource: request.resource,
            startTime: new Date().toISOString(),
            tabId: sender.tab.id
        };
        
        // Update badge to show active streams
        updateActiveBadge();
        
        sendResponse({ status: 'stream-active' });
        return true;
    }
    
    // Handle stream ended notification
    if (request.action === 'streamEnded') {
        const domain = new URL(sender.tab.url).hostname;
        if (activeStreams[domain] && activeStreams[domain][request.streamId]) {
            // Calculate duration
            const startTime = new Date(activeStreams[domain][request.streamId].startTime);
            const endTime = new Date();
            const durationMs = endTime - startTime;
            const durationMinutes = Math.round(durationMs / 60000);
            
            // Log the session duration
            browser.storage.local.get({ logs: [] }).then((data) => {
                const logs = data.logs;
                logs.push({
                    url: domain,
                    resource: activeStreams[domain][request.streamId].resource,
                    timestamp: endTime.toISOString(),
                    duration: durationMinutes,
                    type: 'session-end'
                });
                
                return browser.storage.local.set({ logs });
            }).catch(error => {
                console.error("Error handling stream end:", error);
            });
            
            // Remove from active streams
            delete activeStreams[domain][request.streamId];
            if (Object.keys(activeStreams[domain]).length === 0) {
                delete activeStreams[domain];
            }
            
            // Update badge
            updateActiveBadge();
        }
        
        sendResponse({ status: 'stream-ended' });
        return true;
    }
});

// Function to update badge showing active streams
function updateActiveBadge() {
    // Count total active streams
    let activeCount = 0;
    for (const domain in activeStreams) {
        activeCount += Object.keys(activeStreams[domain]).length;
    }
    
    if (activeCount > 0) {
        browser.browserAction.setBadgeText({ text: activeCount.toString() });
        browser.browserAction.setBadgeBackgroundColor({ color: '#cc0000' }); // Red background
    } else {
        browser.browserAction.setBadgeText({ text: '' });
    }
}
