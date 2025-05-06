// This script runs when the page matches the Moodle login URL
(function() {
  // Debug function to send messages to the background script
  function debug(data) {
    console.log(data);
    try {
      browser.runtime.sendMessage({ action: "debug", data: data });
    } catch (e) {
      console.error("Error sending debug message:", e);
    }
  }

  // Function to extract numbers and operation from captcha text
  function extractCaptchaInfo(text) {
    debug("Extracting from: " + text);
    
    // Case 1: "Please enter first value X , Y ="
    let matches = text.match(/Please enter (first|second) value\s*(\d+)\s*,\s*(\d+)\s*=/);
    if (matches && matches.length >= 4) {
      const whichValue = matches[1]; // "first" or "second"
      const num1 = parseInt(matches[2], 10);
      const num2 = parseInt(matches[3], 10);
      
      debug(`Matched ${whichValue} value pattern: ${num1}, ${num2}`);
      
      return {
        num1: num1,
        num2: num2,
        operation: whichValue // "first" or "second"
      };
    }

    // Case 2: "Please add X + Y ="
    matches = text.match(/Please add\s+(\d+)\s*\+\s*(\d+)\s*=/);
    if (matches && matches.length >= 3) {
      return {
        num1: parseInt(matches[1], 10),
        num2: parseInt(matches[2], 10),
        operation: "add"
      };
    }
    
    // Case 3: "Please subtract X - Y ="
    matches = text.match(/Please subtract\s+(\d+)\s*-\s*(\d+)\s*=/);
    if (matches && matches.length >= 3) {
      return {
        num1: parseInt(matches[1], 10),
        num2: parseInt(matches[2], 10),
        operation: "subtract"
      };
    }
    
    // Alternative format: Value extraction for addition
    matches = text.match(/(\d+)\s*,\s*(\d+)\s*=/);
    if (matches && matches.length >= 3) {
      return {
        num1: parseInt(matches[1], 10),
        num2: parseInt(matches[2], 10),
        operation: "add"
      };
    }
    
    // Alternative format for subtraction
    matches = text.match(/(\d+)\s*-\s*(\d+)\s*=/);
    if (matches && matches.length >= 3) {
      return {
        num1: parseInt(matches[1], 10),
        num2: parseInt(matches[2], 10),
        operation: "subtract"
      };
    }
    
    return null;
  }
  
  // Function to calculate result based on operation
  function calculateResult(info) {
    if (!info) return null;
    
    switch (info.operation) {
      case "first":
        debug("Returning first value: " + info.num1);
        return info.num1;
      case "second":
        debug("Returning second value: " + info.num2);
        return info.num2;
      case "add":
        return info.num1 + info.num2;
      case "subtract":
        return info.num1 - info.num2;
      default:
        return null;
    }
  }
  
  // Function to find and solve captcha
  function solveCaptcha() {
    debug("Starting captcha solving process");
    
    // Find the form and captcha input
    const form = document.getElementById('login');
    if (!form) {
      debug("Login form not found");
      return false;
    }
    
    const captchaInput = document.getElementById('valuepkg3');
    if (!captchaInput) {
      debug("Captcha input field not found");
      return false;
    }
    
    // Get the text that contains the captcha
    const formText = form.innerText || form.textContent;
    debug("Form text: " + formText);
    
    // Find captcha expressions
    const captchaRegex = /(Please [^\n=]+=[^\n]*)/g;
    const captchaMatches = formText.match(captchaRegex);
    
    if (!captchaMatches || captchaMatches.length === 0) {
      debug("No captcha expressions found");
      return false;
    }
    
    debug("Found captcha expressions: " + JSON.stringify(captchaMatches));
    
    // Process the first captcha expression
    const captchaInfo = extractCaptchaInfo(captchaMatches[0]);
    if (!captchaInfo) {
      debug("Failed to extract captcha info");
      return false;
    }
    
    debug("Extracted captcha info: " + JSON.stringify(captchaInfo));
    
    // Calculate the result
    const result = calculateResult(captchaInfo);
    if (result === null) {
      debug("Failed to calculate result");
      return false;
    }
    
    debug("Calculated result: " + result);
    
    // Fill in the captcha input
    captchaInput.value = result;
    debug("Filled captcha input with: " + result);
    
    return true;
  }
  
  // Function to submit the form
  function submitForm() {
    const loginButton = document.getElementById('loginbtn');
    if (loginButton) {
      debug("Clicking login button");
      loginButton.click();
      return true;
    }
    debug("Login button not found");
    return false;
  }
  
  // Direct approach: look for specific expressions in the HTML
  function bruteForceApproach() {
    debug("Starting brute force approach");
    
    // Extract numbers directly from the HTML
    const html = document.documentElement.outerHTML;
    
    // Look for patterns like "61, 4 ="
    const commaPattern = /(\d+)\s*,\s*(\d+)\s*=/g;
    const commaMatches = [...html.matchAll(commaPattern)];
    
    // Look for patterns like "34 - 48 ="
    const minusPattern = /(\d+)\s*-\s*(\d+)\s*=/g;
    const minusMatches = [...html.matchAll(minusPattern)];
    
    const captchaInput = document.getElementById('valuepkg3');
    if (!captchaInput) {
      debug("Captcha input not found");
      return false;
    }
    
    if (commaMatches.length > 0) {
      // Assuming the first match is for addition
      const num1 = parseInt(commaMatches[0][1], 10);
      const num2 = parseInt(commaMatches[0][2], 10);
      const result = num1 + num2;
      
      debug(`Found addition pattern: ${num1}, ${num2} = ${result}`);
      captchaInput.value = result;
      return true;
    }
    
    if (minusMatches.length > 0) {
      // Assuming the first match is for subtraction
      const num1 = parseInt(minusMatches[0][1], 10);
      const num2 = parseInt(minusMatches[0][2], 10);
      const result = num1 - num2;
      
      debug(`Found subtraction pattern: ${num1} - ${num2} = ${result}`);
      captchaInput.value = result;
      return true;
    }
    
    debug("No patterns found with brute force approach");
    return false;
  }
  
  // Directly parse the login form and solve the captcha
  function directParsing() {
    debug("Starting direct parsing approach");
    
    // Find all text nodes in the login form
    function getAllTextNodes(elem) {
      let textNodes = [];
      if (elem) {
        for (let child of elem.childNodes) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            textNodes.push(child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            textNodes = textNodes.concat(getAllTextNodes(child));
          }
        }
      }
      return textNodes;
    }
    
    const form = document.getElementById('login');
    if (!form) {
      debug("Login form not found");
      return false;
    }
    
    const textNodes = getAllTextNodes(form);
    debug(`Found ${textNodes.length} text nodes`);
    
    let captchaNode = null;
    for (let node of textNodes) {
      const text = node.textContent.trim();
      debug(`Text node: "${text}"`);
      
      if (text.includes("Please enter first value") || 
          text.includes("Please subtract") || 
          text.match(/\d+\s*,\s*\d+\s*=/) || 
          text.match(/\d+\s*-\s*\d+\s*=/)) {
        captchaNode = node;
        debug(`Found captcha node: "${text}"`);
        break;
      }
    }
    
    if (!captchaNode) {
      debug("Captcha node not found");
      return false;
    }
    
    const captchaText = captchaNode.textContent.trim();
    const captchaInfo = extractCaptchaInfo(captchaText);
    
    if (!captchaInfo) {
      debug("Failed to extract captcha info from node");
      return false;
    }
    
    const result = calculateResult(captchaInfo);
    if (result === null) {
      debug("Failed to calculate result from node");
      return false;
    }
    
    const captchaInput = document.getElementById('valuepkg3');
    if (!captchaInput) {
      debug("Captcha input field not found");
      return false;
    }
    
    captchaInput.value = result;
    debug(`Set captcha input to ${result}`);
    return true;
  }
  
  // Get stored credentials and fill the form
  async function fillStoredCredentials() {
    try {
      const settings = await browser.storage.sync.get(['username', 'password']);
      
      if (settings.username && settings.password) {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        if (usernameField && passwordField) {
          usernameField.value = settings.username;
          passwordField.value = settings.password;
          debug("Filled credentials from storage");
          return true;
        }
      }
    } catch (e) {
      debug("Error accessing stored credentials: " + e.message);
    }
    return false;
  }
  
  // Main function to handle login
  async function handleLogin() {
    debug("Moodle Captcha Login starting on page: " + window.location.href);
    debug("Page title: " + document.title);
    debug("Document ready state: " + document.readyState);
    
    // Fill credentials directly from storage instead of waiting for browser autofill
    await fillStoredCredentials();
    
    // Check if username and password are filled
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    
    if (!username || !password) {
      debug("Username or password fields not found");
      return;
    }
    
    debug("Username field found: " + (username ? "Yes" : "No"));
    debug("Password field found: " + (password ? "Yes" : "No"));
    debug("Username value present: " + (username.value ? "Yes" : "No"));
    debug("Password value present: " + (password.value ? "Yes" : "No"));
    
    if (!username.value || !password.value) {
      debug("Username or password still not filled - missing from storage");
      return;
    }
    
    debug("Username and password are filled");
    
    // Get the captcha input element
    const captchaInput = document.getElementById('valuepkg3');
    debug("Captcha input field found: " + (captchaInput ? "Yes" : "No"));
    
    // Try all methods to solve the captcha
    let captchaSolved = false;
    
    try {
      debug("Trying first solving method");
      captchaSolved = solveCaptcha();
      if (!captchaSolved) {
        debug("First method failed, trying brute force");
        captchaSolved = bruteForceApproach();
      }
      if (!captchaSolved) {
        debug("Brute force failed, trying direct parsing");
        captchaSolved = directParsing();
      }
      
      if (captchaSolved) {
        debug("Captcha solved successfully");
        submitForm();
      } else {
        debug("All captcha solving methods failed");
      }
    } catch (error) {
      debug("Error during captcha solving: " + error.message);
    }
  }
  
  // Run when the page loads
  async function init() {
    debug("Moodle Captcha Login initialized");
    debug("URL: " + window.location.href);
    debug("User Agent: " + navigator.userAgent);
    debug("Extension starting on: " + new Date().toString());
    
    // Check if Moodle auto login is enabled
    const settings = await browser.storage.sync.get(['autoLoginMoodle']);
    if (settings.autoLoginMoodle === false) {
      debug('Moodle auto-login is disabled, not attempting login');
      return;
    }
    
    try {
      // Check if we're on the login page
      if (window.location.href.includes("login")) {
        debug("Confirmed we are on a login page");
        
        // Check for login form
        const loginForm = document.getElementById('login');
        debug("Login form found: " + (loginForm ? "Yes" : "No"));
        
        // Use a shorter timeout since we're not waiting for browser autofill
        setTimeout(handleLogin, 300);
      } else {
        debug("Not on login page, extension will not run");
      }
    } catch (error) {
      debug("Error during initialization: " + error.message);
    }
  }
  
  // Wait for the page to fully load
  debug("Script loaded, waiting for page to be ready");
  if (document.readyState === "complete") {
    debug("Document already complete, initializing");
    init();
  } else {
    debug("Document not ready, adding load event listener");
    window.addEventListener("load", init);
  }
})();
