document.addEventListener('DOMContentLoaded', async () => {
  const settings = await browser.storage.sync.get([
    'apiKey', 
    'username', 
    'password', 
    'autoLoginOAuth', 
    'autoLoginMoodle',
    'autoLoginWebmail',
    'lastSaved'
  ]);
  
  document.getElementById('apiKey').value = settings.apiKey || '';
  document.getElementById('username').value = settings.username || '';
  
  // Always leave password field blank
  document.getElementById('password').value = '';
  
  // Update placeholder text if password exists
  if (settings.password) {
    document.getElementById('password').placeholder = "Password saved. Enter to change";
  }
  
  // Show last saved info if available
  if (settings.lastSaved) {
    const lastSavedDate = new Date(settings.lastSaved);
    const formattedDate = lastSavedDate.toLocaleString();
    document.getElementById('lastSavedInfo').textContent = `Credentials last saved: ${formattedDate}`;
    document.getElementById('lastSavedInfo').style.display = 'block';
  } else {
    document.getElementById('lastSavedInfo').style.display = 'none';
  }
  
  // Handle the separate toggle switches with appropriate defaults (true if not set)
  document.getElementById('autoLoginOAuth').checked = settings.autoLoginOAuth !== false;
  document.getElementById('autoLoginMoodle').checked = settings.autoLoginMoodle !== false;
  document.getElementById('autoLoginWebmail').checked = settings.autoLoginWebmail !== false;
  
  // Add event listeners for auto-saving toggle switches
  document.getElementById('autoLoginOAuth').addEventListener('change', saveAutoLoginSettings);
  document.getElementById('autoLoginMoodle').addEventListener('change', saveAutoLoginSettings);
  document.getElementById('autoLoginWebmail').addEventListener('change', saveAutoLoginSettings);
});

// Function to automatically save toggle settings
async function saveAutoLoginSettings() {
  try {
    await browser.storage.sync.set({
      autoLoginOAuth: document.getElementById('autoLoginOAuth').checked,
      autoLoginMoodle: document.getElementById('autoLoginMoodle').checked,
      autoLoginWebmail: document.getElementById('autoLoginWebmail').checked
    });
    
    // Show brief confirmation
    const status = document.getElementById('status');
    status.textContent = 'Auto-login settings saved!';
    setTimeout(() => status.textContent = '', 2000);
  } catch (error) {
    console.error('Error saving auto-login settings:', error);
  }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const apiKey = document.getElementById('apiKey').value;
  
  // Only update password if a new one is provided
  const currentSettings = await browser.storage.sync.get(['password']);
  const updatedPassword = password ? password : currentSettings.password || '';
  
  const lastSaved = new Date().getTime();
  
  await browser.storage.sync.set({
    apiKey,
    username,
    password: updatedPassword,
    lastSaved
  });
  
  // Update the last saved info immediately
  const formattedDate = new Date(lastSaved).toLocaleString();
  document.getElementById('lastSavedInfo').textContent = `Credentials last saved: ${formattedDate}`;
  document.getElementById('lastSavedInfo').style.display = 'block';
  
  document.getElementById('password').value = '';
  
  const status = document.getElementById('status');
  status.textContent = 'Credentials saved!';
  setTimeout(() => status.textContent = '', 2000);
});
