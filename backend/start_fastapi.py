#!/usr/bin/env python3
"""
FastAPI RAG Server Startup Script
This script starts the FastAPI RAG server with proper configuration.
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Start the FastAPI RAG server."""
    
    # Ensure the knowledge-base directory exists at project root
    project_root = Path(__file__).resolve().parents[1]
    kb_dir = Path(os.getenv("DATA_DIR", str(project_root / "knowledge-base")))
    kb_dir.mkdir(parents=True, exist_ok=True)
    
    # Set environment variables if not already set
    if not os.getenv("RAG_API_KEY"):
        os.environ["RAG_API_KEY"] = "test-api-key"
    
    print("🚀 Starting Cuttlefish RAG FastAPI Server...")
    print("📍 Server will be available at: http://localhost:5002")
    print("📚 API Documentation will be available at: http://localhost:5002/docs")
    print("🔑 API Key: test-api-key")
    print("=" * 50)
    
    try:
        # Start the server
        uvicorn.run(
            "rag_fastapi:app",
            host="0.0.0.0",
            port=5002,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
