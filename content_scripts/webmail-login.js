// Webmail auto-login script

function debug(message) {
  console.log(`[Webmail Login] ${message}`);
  try {
    browser.runtime.sendMessage({ action: "debug", data: `[Webmail] ${message}` });
  } catch (e) {
    console.error("Error sending debug message:", e);
  }
}

async function fillCredentialsAndLogin() {
  debug('Starting webmail login process');
  
  // Check if webmail auto login is enabled
  const settings = await browser.storage.sync.get(['autoLoginWebmail']);
  if (settings.autoLoginWebmail === false) {
    debug('Webmail auto-login is disabled');
    return;
  }

  // Find login form - different URLs might have different structures
  const loginForm = document.getElementById('login-form') || document.querySelector('form[name="login-form"]');
  if (!loginForm) {
    debug('No login form found - likely already logged in');
    return;
  }

  try {
    const settings = await browser.storage.sync.get(['username', 'password']);
    
    if (!settings.username || !settings.password) {
      debug('No credentials found in storage');
      return;
    }

    // Fill the username and password fields
    const usernameField = document.getElementById('rcmloginuser');
    const passwordField = document.getElementById('rcmloginpwd');
    const loginButton = document.getElementById('rcmloginsubmit');

    if (!usernameField || !passwordField || !loginButton) {
      debug('Could not find all required form elements');
      return;
    }

    debug('Form elements found, filling credentials');
    usernameField.value = settings.username;
    passwordField.value = settings.password;

    // Submit form immediately
    debug('Submitting login form');
    loginButton.click();
    
  } catch (error) {
    debug(`Error during login process: ${error.message}`);
  }
}

// Initialize the login process
function init() {
  debug(`Page loaded: ${window.location.href}`);
  
  // Check for login form regardless of URL
  const loginForm = document.getElementById('login-form') || document.querySelector('form[name="login-form"]');
  if (loginForm) {
    debug('Login form detected, attempting login immediately');
    fillCredentialsAndLogin();
  } else {
    debug('No login form detected on page');
  }
}

// Run as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
