/**
 * PrivaShield AI - Content Script
 * Runs on every page to extract HTML when requested by the popup.
 */

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageHTML") {
    try {
      const html = document.documentElement.outerHTML;
      const url = window.location.href;
      const title = document.title;

      sendResponse({
        success: true,
        html: html,
        url: url,
        title: title,
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message,
      });
    }
  }

  // Return true to indicate async response
  return true;
});
