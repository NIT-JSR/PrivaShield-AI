import os
import shutil
from typing import List, Tuple
import math
from collections import Counter
import re

# HTML & Text Processing
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from llm_config import llm  # shared instance with SQLiteCache
load_dotenv()


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


async def process_policy_async(html_content: str, url_hash: str, existing_summary: str = None) -> Tuple[str, str, str]:
    """
    Asynchronous version of the process policy pipeline for high-speed concurrent execution.
    """
    # 1. Clean Text
    clean_text = clean_html(html_content)
    if len(clean_text) < 100:
        return "Error: Content too short to analyze.", "", ""

    if existing_summary:
        print(f"Skipping LLM summary generation for {url_hash} (Using cached summary)")
        return existing_summary, "", clean_text

    # 2. Generate Summary (Using Groq API asynchronously)
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
        response = await llm.ainvoke(prompt)
        summary = response.content
    except Exception as e:
        summary = f"AI Error: {str(e)}"

    return summary, "", clean_text


def chunk_text(text: str, max_words: int = 200, overlap: int = 50) -> list[dict]:
    # Use RecursiveCharacterTextSplitter for better semantic boundaries (paragraphs, sentences)
    # Estimate characters from words (approx 5 chars per word)
    chunk_size = max_words * 5
    chunk_overlap = overlap * 5
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    
    docs = splitter.create_documents([text])
    
    chunks = []
    for i, doc in enumerate(docs):
        chunks.append({
            "chunk_id": f"chunk_{i}",
            "text": doc.page_content
        })
    return chunks

def tokenize(text: str) -> list[str]:
    return re.findall(r'\b\w+\b', text.lower())

def retrieve_chunks(query: str, chunks: list[dict], top_k: int = 5) -> list[dict]:
    query_tokens = set(tokenize(query))
    # Remove common stop words for better overlap calculation
    stop_words = {"what", "is", "the", "in", "a", "an", "of", "and", "to", "how", "does", "do", "are", "if"}
    query_tokens = query_tokens - stop_words
    
    if not query_tokens:
        return []
    
    for chunk in chunks:
        chunk_tokens = set(tokenize(chunk["text"]))
        if not chunk_tokens:
            chunk["similarity_score"] = 0
            continue
            
        intersection = query_tokens.intersection(chunk_tokens)
        # Overlap coefficient (how much of the query is covered by the chunk)
        score = len(intersection) / len(query_tokens)
        chunk["similarity_score"] = score
        
    sorted_chunks = sorted(chunks, key=lambda x: x["similarity_score"], reverse=True)
    return sorted_chunks[:top_k]


def chat_with_policy(query: str, policy_text: str) -> str:
    """
    Directly answers user's questions about the policy using retrieved chunks.
    """
    if not policy_text:
        return "Error: Policy data not found. Please refresh the analysis."

    print(f"🔎 Answering chat question directly using RAG chunks...")
    chunks = chunk_text(policy_text)
    retrieved = retrieve_chunks(query, chunks, top_k=5)
    
    import json
    
    prompt = f"""You are the Q&A Agent for PolicyLens. You answer user questions about a specific policy using ONLY retrieved chunks provided to you in context — never the full document, never outside knowledge.

INPUT: {{"question": "{query}", "retrieved_chunks": {json.dumps(retrieved, indent=2)}}}

RULES:
- If retrieved_chunks' max similarity_score is below 0.55, respond that the document likely doesn't address this question — do not force an answer from weak matches.
- Cite chunk_id alongside every claim so the frontend can highlight the source in the original document viewer.
- If chunks conflict, present both and note the conflict — do not silently pick one.
- 2-4 sentence answers. No legal advice framing.

OUTPUT (JSON only):
{{
  "answer": "string",
  "confidence": "High|Medium|Low",
  "cited_chunks": ["chunk_id1", "chunk_id2"],
  "document_silent_on_topic": true|false
}}
"""
    try:
        response = llm.invoke(prompt)
        
        # Try to parse JSON from the response to format it nicely for the user, 
        # but if we are called by a route expecting a string, we might just return the raw string or parsed JSON.
        # Keeping return as string to match old signature, but containing JSON format as requested by architecture.
        return response.content
    except Exception as e:
        return f'{{"error": "AI Error: {str(e)}"}}'


async def chat_with_policy_async(query: str, policy_text: str) -> str:
    """
    Directly answers user's questions about the policy asynchronously.
    """
    if not policy_text:
        return "Error: Policy data not found. Please refresh the analysis."

    print(f"🔎 Answering chat question asynchronously using RAG chunks...")
    chunks = chunk_text(policy_text)
    retrieved = retrieve_chunks(query, chunks, top_k=5)
    
    import json
    
    prompt = f"""You are the Q&A Agent for PolicyLens. You answer user questions about a specific policy using ONLY retrieved chunks provided to you in context — never the full document, never outside knowledge.

INPUT: {{"question": "{query}", "retrieved_chunks": {json.dumps(retrieved, indent=2)}}}

RULES:
- If retrieved_chunks' max similarity_score is below 0.55, respond that the document likely doesn't address this question — do not force an answer from weak matches.
- Cite chunk_id alongside every claim so the frontend can highlight the source in the original document viewer.
- If chunks conflict, present both and note the conflict — do not silently pick one.
- 2-4 sentence answers. No legal advice framing.

OUTPUT (JSON only):
{{
  "answer": "string",
  "confidence": "High|Medium|Low",
  "cited_chunks": ["chunk_id1", "chunk_id2"],
  "document_silent_on_topic": true|false
}}
"""
    try:
        response = await llm.ainvoke(prompt)
        return response.content
    except Exception as e:
        return f'{{"error": "AI Error: {str(e)}"}}'