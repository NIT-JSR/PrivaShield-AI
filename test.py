import requests

# 1. Configuration
API_URL = "http://localhost:8000"
# Choose a complex policy to test (e.g., StackOverflow, Reddit, or a news site)
TARGET_URL = "https://stackoverflow.com/legal/privacy-policy"

def test_pipeline():
    
    print(f"🚀 Starting Test on: {TARGET_URL}")
    """
    # --- STEP A: Fetch the Real HTML (Simulating the Chrome Extension) ---
    print("1️⃣  Fetching HTML from the web...")
    try:
        # We need a User-Agent so sites don't think we are a bot and block us
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(TARGET_URL, headers=headers)
        response.raise_for_status()
        html_content = response.text
        print(f"   ✅ Fetched {len(html_content)} characters of HTML.")
    except Exception as e:
        print(f"   ❌ Failed to fetch site: {e}")
        return

    # --- STEP B: Send to Your Backend (/analyze) ---
    print("\n2️⃣  Sending to Backend API (/analyze)...")
    payload = {
        "url": TARGET_URL,
        "html": html_content
    }
    
    try:
        api_response = requests.post(f"{API_URL}/analyze", json=payload)
        data = api_response.json()
        
        if api_response.status_code == 200:
            print("\n   ✅ SUCCESS! Summary Received:")
            print("   " + "-" * 40)
            print(data['summary'])
            print("   " + "-" * 40)
            print(f"   Status: {data['status']}")
        else:
            print(f"   ❌ Backend Error: {api_response.text}")
            return
    except Exception as e:
        print(f"   ❌ Failed to connect to backend: {e}")
        return
    """
    # --- STEP C: Test the Chat RAG (/chat) ---
    print("\n3️⃣  Testing RAG Chat (/chat)...")
    question =input()
    print(f"   ❓ Asking: '{question}'")
    
    chat_payload = {
        "url": TARGET_URL,
        "question": question
    }
    
    try:
        chat_response = requests.post(f"{API_URL}/chat", json=chat_payload)
        chat_data = chat_response.json()
        
        print("\n   ✅ AI Answer:")
        print("   " + "-" * 40)
        print(chat_data['answer'])
        print("   " + "-" * 40)
    except Exception as e:
        print(f"   ❌ Chat Failed: {e}")

if __name__ == "__main__":
    test_pipeline()