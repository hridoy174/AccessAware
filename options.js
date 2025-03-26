document.addEventListener('DOMContentLoaded', function () {
    const notifCheckbox = document.getElementById('enableNotifications');
    chrome.storage.local.get('notificationsEnabled', (data) => {
        notifCheckbox.checked = data.notificationsEnabled !== false;
    });

    document.getElementById('saveOptions').addEventListener('click', () => {
        chrome.storage.local.set({ notificationsEnabled: notifCheckbox.checked }, () => {
            alert('✅ Settings saved!');
        });
    });
});
