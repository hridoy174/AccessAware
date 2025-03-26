chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'logAccess') {
        chrome.storage.local.get({ logs: [], notificationsEnabled: true }, (data) => {
            const logs = data.logs;
            const domain = new URL(sender.tab.url).hostname;

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

            chrome.storage.local.set({ logs }, () => {
                console.log('✅ Log saved successfully:', logs);
            });

            if (data.notificationsEnabled) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/128.png',
                    title: 'AccessAware Alert',
                    message: `${domain} is accessing your ${request.resource}!`,
                    priority: 2
                });
            }

            sendResponse({ status: 'received' });
        });
        return true;
    }
});
