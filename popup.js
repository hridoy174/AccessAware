document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['logs'], function(result) {
      const container = document.getElementById('recent-activities');
      container.innerHTML = '';
      const logs = result.logs || [];
      if(logs.length === 0){
        container.textContent = "No recent activity recorded.";
      } else {
        logs.slice(0, 5).forEach(log => {
          let div = document.createElement('div');
          div.textContent = `${log.url} - ${log.resource} - ${new Date(log.timestamp).toLocaleTimeString()}`;
          container.appendChild(div);
        });
      }
    });
  
    document.getElementById('dashboard-btn').onclick = () => chrome.tabs.create({ url: 'dashboard.html' });
    document.getElementById('options-btn').onclick = () => chrome.runtime.openOptionsPage();
  });
  