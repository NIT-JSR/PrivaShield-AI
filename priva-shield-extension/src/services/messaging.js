// Messaging service for popup ↔ background communication

export function sendMessageToBackground(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action, ...data },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

export function sendMessageToTab(tabId, action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { action, ...data },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

export function onMessage(callback) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    callback(request, sender, sendResponse);
    return true; // Keep the message channel open
  });
}
