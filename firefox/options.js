document.addEventListener('DOMContentLoaded', function () {
    // Existing code for notifications
    const notifCheckbox = document.getElementById('enableNotifications');
    browser.storage.local.get('notificationsEnabled').then((data) => {
        notifCheckbox.checked = data.notificationsEnabled !== false;
    }).catch(error => {
        console.error("Error loading notification settings:", error);
    });

    document.getElementById('saveOptions').addEventListener('click', () => {
        browser.storage.local.set({ notificationsEnabled: notifCheckbox.checked }).then(() => {
            alert('✅ Settings saved!');
        }).catch(error => {
            console.error("Error saving settings:", error);
            alert('❌ Error saving settings!');
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
        browser.storage.local.get(['trustedSites', 'blockedSites']).then(data => {
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
        }).catch(error => {
            console.error("Error loading site permissions:", error);
        });
    }

    // Add trusted site
    function addTrustedSite() {
        const site = trustedSiteInput.value.trim();
        if (!site) return;
        
        browser.storage.local.get({trustedSites: []}).then(data => {
            const trustedSites = data.trustedSites;
            if (!trustedSites.includes(site)) {
                trustedSites.push(site);
                return browser.storage.local.set({trustedSites});
            }
        }).then(() => {
            trustedSiteInput.value = '';
            loadSitePermissions();
        }).catch(error => {
            console.error("Error adding trusted site:", error);
        });
    }

    // Remove trusted site
    function removeTrustedSite(site) {
        browser.storage.local.get({trustedSites: []}).then(data => {
            const trustedSites = data.trustedSites.filter(s => s !== site);
            return browser.storage.local.set({trustedSites});
        }).then(() => {
            loadSitePermissions();
        }).catch(error => {
            console.error("Error removing trusted site:", error);
        });
    }

    // Add blocked site
    function addBlockedSite() {
        const site = blockedSiteInput.value.trim();
        if (!site) return;
        
        browser.storage.local.get({blockedSites: []}).then(data => {
            const blockedSites = data.blockedSites;
            if (!blockedSites.includes(site)) {
                blockedSites.push(site);
                return browser.storage.local.set({blockedSites});
            }
        }).then(() => {
            blockedSiteInput.value = '';
            loadSitePermissions();
        }).catch(error => {
            console.error("Error adding blocked site:", error);
        });
    }

    // Remove blocked site
    function removeBlockedSite(site) {
        browser.storage.local.get({blockedSites: []}).then(data => {
            const blockedSites = data.blockedSites.filter(s => s !== site);
            return browser.storage.local.set({blockedSites});
        }).then(() => {
            loadSitePermissions();
        }).catch(error => {
            console.error("Error removing blocked site:", error);
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
