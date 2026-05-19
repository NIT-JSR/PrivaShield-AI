import os
import shutil
from typing import List, Tuple

# HTML & Text Processing
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
load_dotenv()

# --- CONFIGURATION ---
STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True) # Create folder if not exists

llm = ChatOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    temperature=0.0,
)

def clean_html(raw_html: str) -> str:
    """
    Strips HTML tags, scripts, and styles to leave only readable text.
    """
    soup = BeautifulSoup(raw_html, "html.parser")
    
    # Remove junk tags
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "meta"]):
        tag.decompose()
    
    text = soup.get_text(separator="\n")
    
    # Remove extra whitespace/empty lines
    clean_lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(clean_lines)


def process_policy(html_content: str, url_hash: str, existing_summary: str = None) -> Tuple[str, str, str]:
    """
    Main Pipeline:
    1. Cleans HTML.
    2. Returns summary and cleaned text.
    Returns: (summary_text, empty_string, clean_text)
    """
    # 1. Clean Text
    clean_text = clean_html(html_content)
    if len(clean_text) < 100:
        return "Error: Content too short to analyze.", "", ""

    if existing_summary:
        print(f"Skipping LLM summary generation for {url_hash} (Using cached summary)")
        return existing_summary, "", clean_text

    # 2. Generate Summary (Using Groq)
    # We send the first 15,000 chars to Groq (Flash handles big context easily)
    context_preview = clean_text[:15000] 
    
    prompt = f"""
    You are a Privacy Expert. Analyze the following privacy policy text.
    Identify the most critical risks for the user.
    
    Output Format:
    - **Data Collected:** (List key items)
    - **Third Party Sharing:** (Who gets the data?)
    - **User Rights:** (Can they delete data?)
    - **Risk Score:** (1-10, give a number based on invasiveness)
    
    Policy Text:
    {context_preview}
    """
    
    try:
        response = llm.invoke(prompt)
        summary = response.content
    except Exception as e:
        summary = f"AI Error: {str(e)}"

    return summary, "", clean_text


def chat_with_policy(query: str, policy_text: str) -> str:
    """
    Directly answers user's questions about the policy using the provided policy_text context.
    """
    if not policy_text:
        return "Error: Policy data not found. Please refresh the analysis."

    print(f"🔎 Answering chat question directly using context window...")
    
    # We take the first 30,000 characters of the policy. 
    # That is ~6,000 words, which is more than enough for a standard policy,
    # and leaves plenty of space in Groq's context window.
    context = policy_text[:30000]
    
    prompt = f"""
You are answering questions using a privacy policy document.

Instructions:
- Answer ONLY using the information found in the context.
- Do NOT add outside knowledge.
- Provide a concise, structured answer.
- If multiple parts of the answer exist, summarize them clearly.
- If the answer is not found, say:
  "Hehe, I cannot find that information in the policy."

Context:
{context}

Question:
{query}

Answer:
"""
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
        return f"AI Error: {str(e)}"