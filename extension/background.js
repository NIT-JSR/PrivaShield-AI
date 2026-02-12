/**
 * PrivaShield AI - Background Service Worker
 * Handles message routing and extension lifecycle events.
 */

// Extension installed / updated
chrome.runtime.onInstalled.addListener((details) => {
    console.log("PrivaShield AI installed:", details.reason);

    // Set default settings
    chrome.storage.local.set({
        apiBaseUrl: "http://localhost:8000",
        autoAnalyze: false,
        theme: "dark",
    });
});

// Handle messages between popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeCurrentTab") {
        // Get the active tab and inject content script if needed
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "getPageHTML" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            // Content script not loaded, inject it
                            chrome.scripting.executeScript(
                                {
                                    target: { tabId: tabs[0].id },
                                    files: ["content.js"],
                                },
                                () => {
                                    // Try again after injection
                                    setTimeout(() => {
                                        chrome.tabs.sendMessage(
                                            tabs[0].id,
                                            { action: "getPageHTML" },
                                            sendResponse
                                        );
                                    }, 100);
                                }
                            );
                        } else {
                            sendResponse(response);
                        }
                    }
                );
            }
        });
        return true; // Async response
    }
});
