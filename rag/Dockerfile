FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Setup local storage directory for SQLite fallback
RUN mkdir -p storage

ENV PYTHONUNBUFFERED=1

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# PORT env var is set to 7860 by HF Spaces automatically
CMD ["python", "run.py"]
