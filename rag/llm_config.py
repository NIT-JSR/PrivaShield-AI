"""
PrivaShield AI - Centralized LLM Configuration
All modules import `llm` from here instead of creating their own instances.

LangChain 1.x layout:
  - set_llm_cache  → langchain_core.globals
  - SQLiteCache    → langchain_community.cache
  - ChatOpenAI     → langchain_openai
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.globals import set_llm_cache
from langchain_community.cache import SQLiteCache

load_dotenv()

# ── Persistent LLM cache ─────────────────────────────────────────────────────
# Stored at storage/llm_cache.db — survives server restarts.
# Keyed by (prompt_text, model, temperature) — changing the model busts the cache.
_CACHE_PATH = os.path.join("storage", "llm_cache.db")
os.makedirs("storage", exist_ok=True)
set_llm_cache(SQLiteCache(database_path=_CACHE_PATH))
print(f"[LLM Cache] SQLiteCache active -> {_CACHE_PATH}")

# ── Shared LLM instance ──────────────────────────────────────────────────────
llm = ChatOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY", "NOT_SET"),
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    temperature=0.0,   # deterministic → cache hits are much more frequent
)
