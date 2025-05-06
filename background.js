let geminiApiKey = '';

// Initialize API key from storage
browser.storage.sync.get(['apiKey']).then(settings => {
  geminiApiKey = settings.apiKey;
});

// Update API key when changed in storage
browser.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    geminiApiKey = changes.apiKey.newValue;
  }
});

// Open options page on installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.runtime.openOptionsPage();
  }
});

console.log('Background script initialized at:', new Date().toISOString());

// Handle messages from content scripts
browser.runtime.onMessage.addListener(async (message, sender) => {
  console.log('Background script received message:', {
    type: message.type || message.action,
    sender: sender.url,
    timestamp: new Date().toISOString()
  });

  // Handle OAuth captcha solving
  if (message.type === 'SOLVE_CAPTCHA') {
    if (!geminiApiKey) {
      console.error('Cannot solve CAPTCHA: Gemini API key not configured');
      return { error: 'Gemini API key not configured. Please set it in the extension options.' };
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    try {
      console.log('Making API request to Gemini Flash...');
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "OCR this CAPTCHA image. Return only the exact characters you see, no explanations or additional text."
            }, {
              inline_data: {
                mime_type: "image/jpeg",
                data: message.image
              }
            }]
          }],
          generationConfig: {
            temperature: 0,
            candidateCount: 1,
            topP: 1,
            topK: 1
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', JSON.stringify(errorData, null, 2));
        throw new Error(`API request failed: ${errorData.error.message}`);
      }

      const data = await response.json();
      console.log('Gemini API response data:', data);

      const captchaText = data.candidates[0].content.parts[0].text.trim();
      console.log('Extracted captcha text:', captchaText);
      
      return { text: captchaText };
    } catch (error) {
      console.error('Detailed error in CAPTCHA solving:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      return { error: error.message };
    }
  }
  
  // Handle debug messages
  if (message.action === "loginCompleted") {
    console.log("Login completed");
  } else if (message.action === "debug") {
    console.log("Debug:", message.data);
  } else if (message.action === "openOptions") {
    browser.runtime.openOptionsPage();
  }
});
