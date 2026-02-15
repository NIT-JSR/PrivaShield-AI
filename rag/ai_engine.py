import os
import shutil
from typing import List, Tuple

# HTML & Text Processing
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
# AI & Embeddings
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
import os
from dotenv import load_dotenv # <--- Add this

load_dotenv()
# --- CONFIGURATION ---
STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True) # Create folder if not exists

# Initialize Gemini (Make sure GOOGLE_API_KEY is in your environment variables)
# or pass api_key="Iy..." directly below
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.3)

# Initialize Embeddings (Runs locally, free)
# We use a lightweight model for speed
# Old general-purpose model
# New Legal-specific understanding model
embedding_model = HuggingFaceEmbeddings(model_name="nlpaueb/legal-bert-base-uncased")

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


def process_policy(html_content: str, url_hash: str,existing_summary: str = None) -> Tuple[str, str]:
    """
    Main Pipeline:
    1. Cleans HTML.
    2. Creates Vector DB (FAISS) and saves to disk.
    3. Generates a Summary using Gemini.
    Returns: (summary_text, vector_db_path)
    """
    # 1. Clean Text
    clean_text = clean_html(html_content)
    if len(clean_text) < 100:
        return "Error: Content too short to analyze.", ""

    # 2. Chunking (Split text into manageble pieces)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=400
    )
    docs = text_splitter.create_documents([clean_text])

    # 3. Vector Database (FAISS)
    # This creates the mathematical index of the policy
    vector_db = FAISS.from_documents(docs, embedding_model)
    
    # Save to Disk
    # FAISS saves a folder, so we name it "storage/hash_index"
    save_path = os.path.join(STORAGE_DIR, f"{url_hash}_index")
    vector_db.save_local(save_path)
    if existing_summary:
        print(f"Skipping LLM summary generation for {url_hash} (Using cached summary)")
        return existing_summary, save_path

    # 4. Generate Summary (Using Gemini)
    # We send the first 15,000 chars to Gemini (Flash handles big context easily)
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

    return summary, save_path


def chat_with_policy(query: str, vector_path: str) -> str:
    """
    Loads the specific FAISS index for this site and answers the user's question.
    """
    if not os.path.exists(vector_path):
        return "Error: Policy data not found. Please refresh the analysis."

    expansion_prompt = f"""
    You are an AI assistant optimizing queries for a Privacy Policy search.
    The user asked: "{query}"
    
    Generate 2 variations of this question to improve retrieval from a legal document:
    1. A keyword-heavy version (using terms like 'legal basis', 'consent', 'third-party', 'opt-out').
    2. A version asking about specific mechanisms or tools mentioned in the policy.
    
    Output ONLY the 2 variations separated by a new line. Do not number them.
    """
    
    try:
        # Generate the better queries
        expanded_response = llm.invoke(expansion_prompt)
        variations = expanded_response.content.strip().split('\n')
        # Add the original query to the list
        search_queries = [query] + [v.strip() for v in variations if v.strip()]
    except:
        # If expansion fails, just use original
        search_queries = [query]

    print(f"🔎 Searching with queries: {search_queries}")
    
    
    # 1. Load the Vector DB from disk
    # We must allow dangerous deserialization because we trust our own files
    vector_db = FAISS.load_local(vector_path, embedding_model, allow_dangerous_deserialization=True)

    # 2. Search for relevant chunks (RAG)
    all_docs = []
    for q in search_queries:
        # Fetch top 4 chunks for EACH variation
        docs = vector_db.similarity_search(q, k=4)
        all_docs.extend(docs)

    # Remove duplicates (because different queries might find the same chunk)
    unique_docs = {}
    for doc in all_docs:
        unique_docs[doc.page_content] = doc # specific content is the key
    
    # Combine the unique chunks
    final_docs = list(unique_docs.values())
    context = "\n\n".join([d.page_content for d in final_docs])
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

    
    response = llm.invoke(prompt)
    return response.content