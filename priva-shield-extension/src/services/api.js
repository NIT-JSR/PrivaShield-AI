// API service for backend communication

const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL

export async function analyzePolicy() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Extract policy text from the page
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractPolicy',
    });

    // Send to backend for analysis
    const analysisResult = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tab.url,
        text: response.text,
      }),
    });

    if (!analysisResult.ok) {
      throw new Error('Analysis failed');
    }

    return await analysisResult.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function chatWithPolicy(message, context) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
}
