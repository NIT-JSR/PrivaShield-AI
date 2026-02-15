// Background service worker for PrivaShield extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('PrivaShield extension installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePolicy') {
    // Handle policy analysis request
    handlePolicyAnalysis(request.url)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function handlePolicyAnalysis(url) {
  // TODO: Implement policy analysis logic
  // This will communicate with your backend API
  return {
    success: true,
    data: {
      summary: 'Policy analysis placeholder',
      risks: [],
      permissions: [],
    },
  };
}

// Monitor tab updates to detect privacy policy pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if URL contains privacy policy keywords
    const privacyKeywords = ['privacy', 'policy', 'terms'];
    const urlLower = tab.url.toLowerCase();
    
    if (privacyKeywords.some(keyword => urlLower.includes(keyword))) {
      // Notify user that a privacy policy page was detected
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#4F46E5' });
    }
  }
});
