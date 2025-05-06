document.addEventListener('DOMContentLoaded', async () => {
  const settings = await browser.storage.sync.get([
    'autoLoginOAuth', 
    'autoLoginMoodle',
    'autoLoginWebmail'
  ]);
  
  // Handle the separate toggle switches with appropriate defaults (true if not set)
  document.getElementById('autoLoginOAuth').checked = settings.autoLoginOAuth !== false;
  document.getElementById('autoLoginMoodle').checked = settings.autoLoginMoodle !== false;
  document.getElementById('autoLoginWebmail').checked = settings.autoLoginWebmail !== false;
  
  // Add event listeners to auto-save settings when toggles change
  document.getElementById('autoLoginOAuth').addEventListener('change', saveSettings);
  document.getElementById('autoLoginMoodle').addEventListener('change', saveSettings);
  document.getElementById('autoLoginWebmail').addEventListener('change', saveSettings);
  
  // Open options page for credential editing
  document.getElementById('editCredentials').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
});

// Function to save settings automatically when toggles change
async function saveSettings() {
  const autoLoginOAuth = document.getElementById('autoLoginOAuth').checked;
  const autoLoginMoodle = document.getElementById('autoLoginMoodle').checked;
  const autoLoginWebmail = document.getElementById('autoLoginWebmail').checked;
  
  await browser.storage.sync.set({ 
    autoLoginOAuth, 
    autoLoginMoodle,
    autoLoginWebmail
  });
  
  // Show brief confirmation message
  const status = document.getElementById('status');
  status.textContent = 'Settings saved!';
  setTimeout(() => status.textContent = '', 1000);
}
