---
title: PrivaShield RAG
emoji: 🛡️
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
app_port: 7860
---

# PrivaShield AI — RAG Engine

FastAPI-based privacy policy analysis service powering the PrivaShield AI platform.

## Endpoints
- `GET /` — Health check
- `POST /fetch-html` — Fetch page HTML (server-side to avoid CORS)
- `POST /full-analysis` — Complete parallel AI analysis
- `POST /analyze` — Policy summary
- `POST /chat` — Chat with analyzed policy
- `POST /risks` — Risk analysis
- `POST /permissions` — Permission mapping
- `POST /hidden-clauses` — Hidden clause detection

## Environment Variables (set as Space Secrets)
- `GROQ_API_KEY` — Your Groq API key
- `DATABASE_URL` — PostgreSQL connection string (optional, falls back to SQLite)
