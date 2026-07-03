FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if required (e.g., for sqlite3, build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code (including the static vector DB in data/)
COPY . .

# Cloud Run respects the PORT environment variable
ENV PORT=8000
EXPOSE ${PORT}

# Run via uvicorn. Workers set to 2 for slight concurrency in a single instance.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2
