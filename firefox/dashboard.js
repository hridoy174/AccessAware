document.addEventListener('DOMContentLoaded', function () {
    const tbody = document.querySelector('#logList');
    const selectAllCheckbox = document.querySelector('#selectAll');
    const deleteSelectedButton = document.querySelector('#deleteSelected');
    
    // New elements
    const domainFilter = document.getElementById('domainFilter');
    const resourceFilter = document.getElementById('resourceFilter');
    const dateFilter = document.getElementById('dateFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Stats elements
    const totalRecordsEl = document.getElementById('total-records');
    const cameraAccessesEl = document.getElementById('camera-accesses');
    const micAccessesEl = document.getElementById('mic-accesses');
    const uniqueDomainsEl = document.getElementById('unique-domains');
    
    // Export/Import elements
    const exportBtn = document.getElementById('exportData');
    const importBtn = document.getElementById('importData');
    const importFile = document.getElementById('importFile');
    
    let allLogs = []; // Store all logs for filtering
    
    function loadLogs(filters = {}) {
        browser.storage.local.get(['logs']).then(function (result) {
            allLogs = result.logs || [];
            
            // Calculate statistics
            if (totalRecordsEl) updateStatistics(allLogs);
            
            // Apply filters if any
            let filteredLogs = allLogs;
            
            if (filters.domain) {
                filteredLogs = filteredLogs.filter(log => 
                    log.url.toLowerCase().includes(filters.domain.toLowerCase())
                );
            }
            
            if (filters.resource && filters.resource !== 'all') {
                filteredLogs = filteredLogs.filter(log => 
                    log.resource === filters.resource
                );
            }
            
            if (filters.date) {
                const filterDate = new Date(filters.date);
                filterDate.setHours(0, 0, 0, 0);
                const nextDay = new Date(filterDate);
                nextDay.setDate(nextDay.getDate() + 1);
                
                filteredLogs = filteredLogs.filter(log => {
                    const logDate = new Date(log.timestamp);
                    return logDate >= filterDate && logDate < nextDay;
                });
            }
            
            // Display logs
            displayLogs(filteredLogs);
        }).catch(error => {
            console.error("Error loading logs:", error);
        });
    }
    
    function updateStatistics(logs) {
        // Count total records
        if (totalRecordsEl) totalRecordsEl.textContent = logs.length;
        
        // Count by resource type
        const cameraCount = logs.filter(log => log.resource === 'Camera').length;
        const micCount = logs.filter(log => log.resource === 'Microphone').length;
        if (cameraAccessesEl) cameraAccessesEl.textContent = cameraCount;
        if (micAccessesEl) micAccessesEl.textContent = micCount;
        
        // Count unique domains
        const uniqueDomains = new Set(logs.map(log => log.url)).size;
        if (uniqueDomainsEl) uniqueDomainsEl.textContent = uniqueDomains;
    }
    
    function displayLogs(logs) {
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (logs.length > 0) {
            logs.reverse().forEach((log, index) => {
                const row = document.createElement('tr');
                
                // Add status class for trusted/blocked sites
                if (log.trusted) {
                    row.classList.add('trusted-site');
                } else if (log.blocked) {
                    row.classList.add('blocked-site');
                }
                
                // Determine status text
                let status = 'Normal';
                if (log.trusted) status = 'Trusted';
                if (log.blocked) status = 'Blocked';
                if (log.type === 'session-end') status = 'Session End';
                if (log.type === 'session-terminated') status = 'Session Terminated';
                
                // Create row with all fields
                let rowHtml = `
                    <td><input type="checkbox" data-index="${logs.length - index - 1}" class="logCheckbox"></td>
                    <td>${log.url}</td>
                    <td>${log.resource}</td>
                    <td>${new Date(log.timestamp).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' })}</td> `;
                
                // Add status column if it exists in the table
                const headers = document.querySelectorAll('th');
                if (headers.length >= 5) {
                    rowHtml += `<td>${status}</td>`;
                }
                
                // Add duration column if session-related
                if (log.duration !== undefined) {
                    rowHtml += `<td>${log.duration} min</td>`;
                } else if (headers.length >= 6) {
                    rowHtml += '<td>-</td>';
                }
                
                row.innerHTML = rowHtml;
                tbody.appendChild(row);
            });
        } else {
            // Determine how many columns we have
            const colCount = document.querySelectorAll('th').length;
            tbody.innerHTML = `<tr><td colspan="${colCount}">No logs recorded yet.</td></tr>`;
        }
    }

    // Select All functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.logCheckbox');
            checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
        });
    }

    // Delete selected functionality
    if (deleteSelectedButton) {
        deleteSelectedButton.addEventListener('click', () => {
            browser.storage.local.get(['logs']).then(function (result) {
                let logs = result.logs || [];
                const checkboxes = document.querySelectorAll('.logCheckbox:checked');
                const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));

                logs = logs.filter((_, index) => !indicesToDelete.includes(index));

                return browser.storage.local.set({ logs });
            }).then(() => {
                loadLogs();
            }).catch(error => {
                console.error("Error deleting logs:", error);
            });
        });
    }
    
    // Filter functionality
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const filters = {
                domain: domainFilter.value,
                resource: resourceFilter.value,
                date: dateFilter.value
            };
            loadLogs(filters);
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (domainFilter) domainFilter.value = '';
            if (resourceFilter) resourceFilter.value = 'all';
            if (dateFilter) dateFilter.value = '';
            loadLogs();
        });
    }
    
    // Export functionality
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            browser.storage.local.get(null).then((data) => {
                // Prepare data for export
                const exportData = {
                    logs: data.logs || [],
                    trustedSites: data.trustedSites || [],
                    blockedSites: data.blockedSites || [],
                    notificationsEnabled: data.notificationsEnabled,
                    exportDate: new Date().toISOString()
                };
                
                // Create a blob and download link
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `accessaware-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }).catch(error => {
                console.error("Error exporting data:", error);
                alert('Error exporting data!');
            });
        });
    }
    
    // Import functionality
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
            if (!importFile.files.length) {
                alert('Please select a file to import');
                return;
            }
            
            const file = importFile.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate imported data format
                    if (!data.logs || !Array.isArray(data.logs)) {
                        throw new Error('Invalid data format: missing logs array');
                    }
                    
                    // Confirm import
                    if (confirm(`Import ${data.logs.length} logs and settings? This will replace your current data.`)) {
                        // Store imported data
                        browser.storage.local.set({
                            logs: data.logs,
                            trustedSites: data.trustedSites || [],
                            blockedSites: data.blockedSites || [],
                            notificationsEnabled: data.notificationsEnabled
                        }).then(() => {
                            alert('Data imported successfully!');
                            location.reload(); // Refresh page to show imported data
                        }).catch(error => {
                            console.error("Error importing data:", error);
                            alert(`Error storing imported data: ${error.message}`);
                        });
                    }
                } catch (err) {
                    alert(`Error importing data: ${err.message}`);
                }
            };
            
            reader.readAsText(file);
        });
    }

    // Initialize
    loadLogs();
});
