FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the necessary source files (exclude data directories via .dockerignore)
COPY rag_fastapi.py .   
COPY start_fastapi.py .
COPY package.json .

# Create necessary directories (these will be mounted as volumes)
RUN mkdir -p /app/data /app/logs/rag /app/logs/trust /app/logs/voice /app/storage /app/cache

# Expose port
EXPOSE 5002

# Start the application
CMD ["python", "start_fastapi.py"]
