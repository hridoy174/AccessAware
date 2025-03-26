document.addEventListener('DOMContentLoaded', function () {
    const tbody = document.querySelector('#logList');
    const selectAllCheckbox = document.querySelector('#selectAll');
    const deleteSelectedButton = document.querySelector('#deleteSelected');

    function loadLogs() {
        chrome.storage.local.get(['logs'], function (result) {
            const logs = result.logs || [];
            tbody.innerHTML = '';

            if (logs.length > 0) {
                logs.reverse().forEach((log, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="checkbox" data-index="${logs.length - index - 1}" class="logCheckbox"></td>
                        <td>${log.url}</td>
                        <td>${log.resource}</td>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4">No logs recorded yet.</td></tr>';
            }
        });
    }

    // Select All functionality
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.logCheckbox');
        checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
    });

    // Delete selected functionality
    deleteSelectedButton.addEventListener('click', () => {
        chrome.storage.local.get(['logs'], function (result) {
            let logs = result.logs || [];
            const checkboxes = document.querySelectorAll('.logCheckbox:checked');
            const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));

            logs = logs.filter((_, index) => !indicesToDelete.includes(index));

            chrome.storage.local.set({ logs }, loadLogs);
        });
    });

    loadLogs();
});
