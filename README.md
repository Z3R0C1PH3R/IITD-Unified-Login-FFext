# IITD-Unified-Login-FFext
---
# IITD Login Assistant

IITD Login Assistant is a browser extension designed to streamline the login experience for IIT Delhi students and faculty across multiple IITD platforms. It automatically handles authentication for Kerberos OAuth, Moodle, and Webmail portals, saving time and eliminating the hassle of dealing with CAPTCHAs and repetitive logins.


## Features

- **CAPTCHA Automation**: 
  - Automatically solves image CAPTCHAs on the OAuth login page using Gemini AI
  - Solves math CAPTCHAs on Moodle login page
  - No manual CAPTCHA solving needed

- **One-Click Access**: 
  - Auto-fills your credentials securely
  - Automatically submits login forms
  - Provides quick access links to common IITD portals

- **Multi-Platform Support**: 
  - Works with Kerberos OAuth, Moodle, and Webmail systems
  - Individual toggle controls for each platform

- **Privacy Focused**: 
  - All credentials stored locally on your device
  - No data sent to any third-party servers
  - Transparent, open-source code

## Installation

### From Firefox Add-ons

1. Visit the [IITD Login Assistant page on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/iitd-unified-login-assistant/)
2. Click "Add to Firefox"
3. Follow the setup instructions after installation

## Setup

After installation, the extension will open the settings page automatically. If not, go to settings>extensions>manage extension:

1. **Enter your credentials**:
   - IITD Kerberos Username
   - IITD Kerberos Password

2. **For OAuth CAPTCHA solving** (optional but recommended):
   - Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/)
   - Enter the API key in the extension settings
   - Free tier API credits are more than sufficient for CAPTCHA solving

3. **Choose which login systems to automate**:
   - Toggle individual switches for OAuth, Moodle, and Webmail

## Usage

Once set up, simply navigate to any of the supported login pages:

- **OAuth/Kerberos**: The extension will fill your credentials, solve the image CAPTCHA, and submit the form
- **Moodle**: The extension will fill your credentials, solve the math CAPTCHA, and submit the form
- **Webmail**: The extension will fill your credentials and submit the form

You can also access quick links to IITD services directly from the extension popup.

## Privacy & Security

- All your credentials are stored securely in your browser's local storage
- For OAuth login, CAPTCHA images are processed using Google's Gemini API
- No credential data is ever sent to any third-party servers
- The extension only accesses IITD domains and the Gemini API (if enabled)

## Contact

For support or suggestions, please contact: z3r0c1ph3r@pm.me

---

**Note**: This extension is not officially affiliated with IIT Delhi. It is a student-created tool designed to enhance the login experience.
