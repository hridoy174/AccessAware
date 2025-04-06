document.addEventListener('DOMContentLoaded', function () {
    // Existing code for notifications
    const notifCheckbox = document.getElementById('enableNotifications');
    chrome.storage.local.get('notificationsEnabled', (data) => {
        notifCheckbox.checked = data.notificationsEnabled !== false;
    });

    document.getElementById('saveOptions').addEventListener('click', () => {
        chrome.storage.local.set({ notificationsEnabled: notifCheckbox.checked }, () => {
            alert('✅ Settings saved!');
        });
    });

    // New code for site permissions
    const trustedSiteInput = document.getElementById('trusted-site-input');
    const addTrustedSiteBtn = document.getElementById('add-trusted-site');
    const trustedSitesList = document.getElementById('trusted-sites-list');
    const blockedSiteInput = document.getElementById('blocked-site-input');
    const addBlockedSiteBtn = document.getElementById('add-blocked-site');
    const blockedSitesList = document.getElementById('blocked-sites-list');

    // Load existing site permissions
    function loadSitePermissions() {
        chrome.storage.local.get(['trustedSites', 'blockedSites'], data => {
            const trustedSites = data.trustedSites || [];
            const blockedSites = data.blockedSites || [];
            
            // Display trusted sites
            trustedSitesList.innerHTML = '';
            trustedSites.forEach(site => {
                const li = document.createElement('li');
                li.textContent = site;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.classList.add('remove-btn');
                removeBtn.onclick = () => removeTrustedSite(site);
                li.appendChild(removeBtn);
                trustedSitesList.appendChild(li);
            });
            
            // Display blocked sites
            blockedSitesList.innerHTML = '';
            blockedSites.forEach(site => {
                const li = document.createElement('li');
                li.textContent = site;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.classList.add('remove-btn');
                removeBtn.onclick = () => removeBlockedSite(site);
                li.appendChild(removeBtn);
                blockedSitesList.appendChild(li);
            });
        });
    }

    // Add trusted site
    function addTrustedSite() {
        const site = trustedSiteInput.value.trim();
        if (!site) return;
        
        chrome.storage.local.get({trustedSites: []}, data => {
            const trustedSites = data.trustedSites;
            if (!trustedSites.includes(site)) {
                trustedSites.push(site);
                chrome.storage.local.set({trustedSites}, () => {
                    trustedSiteInput.value = '';
                    loadSitePermissions();
                });
            }
        });
    }

    // Remove trusted site
    function removeTrustedSite(site) {
        chrome.storage.local.get({trustedSites: []}, data => {
            const trustedSites = data.trustedSites.filter(s => s !== site);
            chrome.storage.local.set({trustedSites}, loadSitePermissions);
        });
    }

    // Add blocked site
    function addBlockedSite() {
        const site = blockedSiteInput.value.trim();
        if (!site) return;
        
        chrome.storage.local.get({blockedSites: []}, data => {
            const blockedSites = data.blockedSites;
            if (!blockedSites.includes(site)) {
                blockedSites.push(site);
                chrome.storage.local.set({blockedSites}, () => {
                    blockedSiteInput.value = '';
                    loadSitePermissions();
                });
            }
        });
    }

    // Remove blocked site
    function removeBlockedSite(site) {
        chrome.storage.local.get({blockedSites: []}, data => {
            const blockedSites = data.blockedSites.filter(s => s !== site);
            chrome.storage.local.set({blockedSites}, loadSitePermissions);
        });
    }

    // Add event listeners
    if (addTrustedSiteBtn) {
        addTrustedSiteBtn.addEventListener('click', addTrustedSite);
    }
    
    if (addBlockedSiteBtn) {
        addBlockedSiteBtn.addEventListener('click', addBlockedSite);
    }

    // Initialize
    loadSitePermissions();
});
