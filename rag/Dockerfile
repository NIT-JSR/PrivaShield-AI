FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required by some packages (e.g., build-essential, g++)
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Setup local storage directory for SQLite persistence
RUN mkdir -p storage

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Using run.py as the entrypoint
CMD ["python", "run.py"]
