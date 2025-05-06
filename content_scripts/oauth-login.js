const MAX_RETRIES = 3;
let retryCount = 0;
let apiKeyMissing = false; // Flag to track if API key is missing
let progressIndicator = null;
let loginSuccess = false; // Flag to track if login attempt was successful

// Create and insert a progress indicator into the page
function createProgressIndicator() {
  // Check if we already created it
  if (progressIndicator) return progressIndicator;
  
  // Create container for the progress messages
  progressIndicator = document.createElement('div');
  progressIndicator.style.margin = '10px 0';
  progressIndicator.style.padding = '8px 12px';
  progressIndicator.style.backgroundColor = '#f0f7ff';
  progressIndicator.style.border = '1px solid #0078d7';
  progressIndicator.style.borderRadius = '4px';
  progressIndicator.style.fontSize = '14px';
  progressIndicator.style.fontWeight = 'normal';
  progressIndicator.style.color = '#333';
  
  // Add title
  const title = document.createElement('div');
  title.textContent = 'Auto Login Extension Progress:';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '5px';
  progressIndicator.appendChild(title);
  
  // Add status message container
  const status = document.createElement('div');
  status.id = 'captcha-solve-status';
  status.style.display = 'flex';
  status.style.alignItems = 'center';
  progressIndicator.appendChild(status);
  
  // Insert it before the captcha
  const captchaImage = document.querySelector('#captcha_image');
  if (captchaImage && captchaImage.parentElement && captchaImage.parentElement.parentElement) {
    captchaImage.parentElement.parentElement.insertBefore(progressIndicator, captchaImage.parentElement);
  }
  
  return progressIndicator;
}

// Update progress status with message and optional spinner
function updateProgress(message, showSpinner = true) {
  createProgressIndicator();
  
  const statusDiv = document.getElementById('captcha-solve-status');
  if (!statusDiv) return;
  
  // Clear previous content
  statusDiv.innerHTML = '';
  
  // Add spinner if requested
  if (showSpinner) {
    const spinner = document.createElement('div');
    spinner.style.width = '16px';
    spinner.style.height = '16px';
    spinner.style.border = '3px solid rgba(0, 120, 215, 0.3)';
    spinner.style.borderTop = '3px solid rgba(0, 120, 215, 1)';
    spinner.style.borderRadius = '50%';
    spinner.style.marginRight = '10px';
    spinner.style.animation = 'spin 1.5s linear infinite';
    statusDiv.appendChild(spinner);
    
    // Add keyframe animation for spinner
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }
  
  // Add the message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  statusDiv.appendChild(messageSpan);
}

// Complete progress with success or failure
function completeProgress(success, message) {
  createProgressIndicator();
  
  const statusDiv = document.getElementById('captcha-solve-status');
  if (!statusDiv) return;
  
  // Clear previous content
  statusDiv.innerHTML = '';
  
  // Add icon based on success/failure
  const icon = document.createElement('span');
  icon.style.marginRight = '10px';
  icon.style.fontSize = '16px';
  
  if (success) {
    icon.textContent = '✓';
    icon.style.color = 'green';
    statusDiv.style.color = 'green';
  } else {
    icon.textContent = '✗';
    icon.style.color = 'red';
    statusDiv.style.color = 'red';
  }
  
  statusDiv.appendChild(icon);
  
  // Add the message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  statusDiv.appendChild(messageSpan);
}

async function solveCaptcha() {
  console.log('Starting captcha solving process...');
  updateProgress('Starting CAPTCHA solving process...');
  
  const captchaImage = document.querySelector('#captcha_image');
  if (!captchaImage) {
    console.error('Captcha image element not found on page');
    completeProgress(false, 'CAPTCHA image not found');
    return false;
  }
  console.log('Found captcha image:', captchaImage.src);
  updateProgress('CAPTCHA image detected');

  try {
    updateProgress('Capturing CAPTCHA image...');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = captchaImage.width;
    canvas.height = captchaImage.height;
    ctx.drawImage(captchaImage, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
    console.log('Captured captcha image, base64 length:', imageBase64.length);

    updateProgress('Sending to Gemini AI for processing...');
    console.log('Sending message to background script...');
    const response = await browser.runtime.sendMessage({
      type: 'SOLVE_CAPTCHA',
      image: imageBase64
    });
    console.log('Received response from background script:', response);

    if (response.text) {
      updateProgress(`CAPTCHA recognized: "${response.text}"`, false);
      const captchaInput = document.querySelector('#captcha_code');
      if (captchaInput) {
        captchaInput.value = response.text;
        console.log('Successfully filled captcha with:', response.text);
        completeProgress(true, `CAPTCHA solved: "${response.text}"`);
        return true;
      } else {
        console.error('Captcha input field not found');
        completeProgress(false, 'CAPTCHA input field not found');
      }
    } else if (response.error) {
      console.error('Error from API:', response.error);
      completeProgress(false, `Failed to solve CAPTCHA: ${response.error}`);
      
      // If the error is about API key, mark it as missing to prevent retries
      if (response.error.includes('API key')) {
        apiKeyMissing = true;
      }
    } else {
      console.error('No text in response:', response);
      completeProgress(false, 'Failed to recognize CAPTCHA text');
    }
  } catch (error) {
    console.error('Error in solveCaptcha:', error);
    completeProgress(false, `Error: ${error.message}`);
  }
  return false;
}

async function fillCredentials() {
  const settings = await browser.storage.sync.get(['username', 'password']);
  const username = document.querySelector('#username');
  const password = document.querySelector('#password');
  
  if (settings.username && username) {
    username.value = settings.username;
  }
  if (settings.password && password) {
    password.value = settings.password;
  }
  
  return !!(settings.username && settings.password);
}

async function attemptLogin() {
  console.log('Attempting login...');
  // Check if login was already successful
  if (loginSuccess) {
    console.log('Login already successful, not attempting again');
    return;
  }

  const username = document.querySelector('#username');
  const password = document.querySelector('#password');
  const submitButton = document.querySelector('button[type="submit"]');

  console.log('Form elements found:', {
    username: !!username,
    password: !!password,
    submitButton: !!submitButton
  });

  if (!username || !password || !submitButton) {
    console.error('Required form elements not found');
    if (progressIndicator) {
      completeProgress(false, 'Login form elements not found');
    }
    return;
  }

  // Fill credentials
  updateProgress('Filling credentials...');
  const credentialsFound = await fillCredentials();
  if (!credentialsFound) {
    console.log('No credentials configured');
    completeProgress(false, 'No login credentials found. Please add them in extension settings.');
    return;
  }

  console.log('Credentials found, attempting to solve captcha...');
  const solved = await solveCaptcha();
  if (solved) {
    updateProgress('Submitting login form...', false);
    console.log('Captcha solved, clicking submit button...');
    loginSuccess = true; // Mark that we've successfully solved and are submitting
    setTimeout(() => {
      submitButton.click();
    }, 100);
  } else {
    console.log(`Captcha solve failed. Retry count: ${retryCount}/${MAX_RETRIES}`);
    if (retryCount < MAX_RETRIES && !apiKeyMissing) {
      retryCount++;
      updateProgress(`Attempt failed. Retrying (${retryCount}/${MAX_RETRIES})...`);
      const refreshButton = document.querySelector('img[alt="Refresh Image"]');
      if (refreshButton) {
        console.log('Refreshing captcha...');
        refreshButton.click();
        // Reduce delay to 800ms, which is enough for the image to load
        setTimeout(attemptLogin, 800);
      } else {
        console.error('Refresh button not found');
        completeProgress(false, 'Failed to find CAPTCHA refresh button');
      }
    } else {
      completeProgress(false, `Failed after ${MAX_RETRIES} attempts`);
    }
  }
}

console.log('Content script loaded. Document state:', document.readyState);

async function startLoginAttempts() {
  // Check if OAuth auto login is enabled
  const settings = await browser.storage.sync.get(['autoLoginOAuth', 'apiKey']);
  if (settings.autoLoginOAuth === false) {
    console.log('OAuth auto-login is disabled, not attempting login');
    return;
  }
  
  // Check for API key upfront. If missing, fill credentials, show message, and stop.
  if (!settings.apiKey) {
    apiKeyMissing = true;
    console.log('No API key configured. Filling credentials and prompting for manual CAPTCHA.');
    
    // Fill credentials without showing the progress indicator first
    await fillCredentials();

    // Display message on the page
    const messageContainer = document.createElement('div');
    messageContainer.style.color = '#ff6600';
    messageContainer.style.fontWeight = 'bold';
    messageContainer.style.margin = '10px 0';
    messageContainer.style.padding = '10px';
    messageContainer.style.backgroundColor = '#fffaf0';
    messageContainer.style.border = '1px solid #ff6600';
    messageContainer.style.borderRadius = '4px';
    messageContainer.textContent = 'Auto Login Extension: Credentials filled automatically. Please solve CAPTCHA manually (API key not configured).';
    
    const optionsLink = document.createElement('a');
    optionsLink.href = '#';
    optionsLink.textContent = 'Click here to set up your API key for automatic CAPTCHA solving';
    optionsLink.style.display = 'block';
    optionsLink.style.marginTop = '5px';
    optionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      browser.runtime.sendMessage({ action: "openOptions" });
    });
    
    messageContainer.appendChild(document.createElement('br'));
    messageContainer.appendChild(optionsLink);
    
    const captchaImage = document.querySelector('#captcha_image');
    // Insert message before the captcha image's container or a fallback
    if (captchaImage && captchaImage.parentElement && captchaImage.parentElement.parentElement) {
      captchaImage.parentElement.parentElement.insertBefore(messageContainer, captchaImage.parentElement);
    } else if (document.body) { // Absolute fallback
      document.body.insertBefore(messageContainer, document.body.firstChild);
    }
    
    // Don't create the progress indicator or call completeProgress to avoid duplication
    return; // Stop further auto-login attempts for CAPTCHA
  }
  
  // Only create progress indicator and show status if we have an API key
  createProgressIndicator();
  updateProgress('Starting auto-login process...');
  attemptLogin();
  
  // The retry interval is only set up if an API key is present (due to the return above).
  const checkInterval = setInterval(async () => {
    // Stop retrying if login was successful, the API key is marked as missing (e.g. by solveCaptcha),
    // or we reached max retries
    if (loginSuccess || apiKeyMissing || retryCount >= MAX_RETRIES) {
      console.log('Stopping retry interval:', 
                  loginSuccess ? 'Login successful' : (apiKeyMissing ? 'API key issue' : 'Max retries reached'));
      clearInterval(checkInterval);
      return;
    }

    // Re-check auto-login status on each iteration
    const currentSettings = await browser.storage.sync.get(['autoLoginOAuth']);
    if (currentSettings.autoLoginOAuth === false) {
      console.log('OAuth auto-login was disabled, stopping attempts');
      clearInterval(checkInterval);
      return;
    }
    
    // Check if form still exists (if not, login probably succeeded)
    const submitButton = document.querySelector('button[type="submit"]');
    if (!submitButton) {
      console.log('Login successful or page changed, stopping attempts');
      loginSuccess = true;
      clearInterval(checkInterval);
    } else {
      console.log('Retrying login attempt...');
      attemptLogin();
    }
  }, 1500);
  
  // Safety cleanup - clear the interval after a reasonable time
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000); // 30 seconds max
}

// Listen for successful form submission
document.addEventListener('submit', (e) => {
  if (e.target && e.target.querySelector && e.target.querySelector('#username')) {
    console.log('Login form submitted, marking as success');
    loginSuccess = true;
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLoginAttempts);
} else {
  startLoginAttempts();
}
