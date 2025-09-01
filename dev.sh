#!/bin/bash

# CuttleFish Development Startup Script

echo "🐙 Starting CuttleFish Development Environment..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Centralized caches
export PYTHONPYCACHEPREFIX="$(pwd)/cache/pycache"
export NEXT_FRONTEND_DIST_DIR="cache/.next"
export NEXT_WIDGET_DIST_DIR="cache/.next"

# Install dependencies if node_modules doesn't exist
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Install backend dependencies
echo "🐍 Installing backend dependencies..."
cd backend && pip install -r requirements.txt && cd ..

# Centralize .env files in enviornment/
mkdir -p enviornment

# Create enviornment/frontend.env if it doesn't exist
if [ ! -f "enviornment/frontend.env" ]; then
    echo "🔧 Creating enviornment/frontend.env file..."
    cat > enviornment/frontend.env << EOF
NEXT_PUBLIC_API_URL=http://localhost:5002
NEXT_PUBLIC_RAG_API_KEY=test-api-key
EOF
fi

# Create enviornment/backend.env if it doesn't exist
if [ ! -f "enviornment/backend.env" ]; then
    echo "🔧 Creating enviornment/backend.env file..."
    cat > enviornment/backend.env << EOF
RAG_API_KEY=test-api-key
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
XAI_API_KEY=your_xai_key_here
EOF
fi

# Export envs for local dev so app processes inherit them
set -a
[ -f "enviornment/backend.env" ] && . enviornment/backend.env
[ -f "enviornment/frontend.env" ] && . enviornment/frontend.env
set +a

echo "🚀 Starting development servers..."
echo "Using caches:"
echo "  Python pycache: $PYTHONPYCACHEPREFIX"
echo "  Next.js dist (frontend): $NEXT_FRONTEND_DIST_DIR"
echo "  Next.js dist (widget):   $NEXT_WIDGET_DIST_DIR"
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:5002"
echo "Backend API docs at: http://localhost:5002/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================================"

# Start both services concurrently
npm run dev
