// Content script that runs inside websites

// Extract privacy policy text from the current page
function extractPolicyText() {
  // Try to find the main content area
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '.privacy-policy',
    '#privacy-policy',
    '.content',
    '#content',
  ];

  let content = null;
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element;
      break;
    }
  }

  // Fallback to body if no main content found
  if (!content) {
    content = document.body;
  }

  return content.innerText;
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPolicy') {
    const policyText = extractPolicyText();
    sendResponse({ text: policyText });
  }
  return true;
});

// Detect if current page is a privacy policy
function detectPrivacyPolicy() {
  const title = document.title.toLowerCase();
  const url = window.location.href.toLowerCase();
  const privacyKeywords = ['privacy', 'policy', 'terms', 'conditions'];

  return privacyKeywords.some(
    (keyword) => title.includes(keyword) || url.includes(keyword)
  );
}

// Notify background script if this is a privacy policy page
if (detectPrivacyPolicy()) {
  chrome.runtime.sendMessage({
    action: 'privacyPolicyDetected',
    url: window.location.href,
  });
}
