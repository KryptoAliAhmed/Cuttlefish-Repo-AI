# 🐙 CuttleFish - Advanced AI-Powered RAG System

<div align="center">

![CuttleFish Logo](https://img.shields.io/badge/CuttleFish-AI%20RAG%20System-blue?style=for-the-badge&logo=octopus-deploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68+-green.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

**An intelligent, multi-modal AI system combining RAG, multi-agent orchestration, and advanced voice transcription**

[🚀 Quick Start](#quick-start) • [📚 Features](#features) • [🏗️ Architecture](#architecture) • [🔧 Setup](#setup) • [📖 API Documentation](#api-documentation) • [🤝 Contributing](#contributing)

</div>

---

## 🌟 Overview

CuttleFish is a cutting-edge AI system that combines **Retrieval Augmented Generation (RAG)**, **multi-agent orchestration**, and **advanced voice transcription** to create an intelligent, context-aware AI assistant. Named after the highly intelligent cephalopod, CuttleFish demonstrates remarkable adaptability and problem-solving capabilities.

### 🎯 Key Capabilities

- **🧠 Semantic Re-ranking RAG**: Advanced document retrieval with hybrid semantic and keyword search
- **🤖 Multi-Agent Orchestration**: Specialized AI agents working together for complex tasks
- **🎤 Streaming Voice Transcription**: Real-time speech-to-text with enhanced sensitivity
- **📄 Document Ingestion**: Intelligent document processing and knowledge base management
- **📊 Evaluation Pipeline**: Comprehensive quality assessment and performance metrics
- **🔐 Web3 Integration**: Blockchain-based agent factory and tokenization

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **Docker** (optional)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI.git
cd Cuttlefish-Repo-AI

# Backend Setup
cd backend
pip install -r requirements.txt

# Frontend Setup
cd ../frontend
npm install

# Widget Setup (optional)
cd ../widget
npm install
```

### Environment Configuration

Create environment files for each component:

```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
XAI_API_KEY=your_xai_api_key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5002
```

### Running the Application

```bash
# Start Backend
cd backend
python start_fastapi.py

# Start Frontend (in new terminal)
cd frontend
npm run dev

# Start Widget (optional)
cd widget
npm run dev
```

---

## 📚 Features

### 🧠 Enhanced RAG System

- **Semantic Re-ranking**: Combines semantic and keyword-based retrieval
- **Hybrid Search**: TF-IDF + embedding-based similarity scoring
- **Context-Aware Responses**: Intelligent document chunking and context selection
- **Multi-Provider Support**: OpenAI, Gemini, and xAI (Grok) integration

### 🤖 Multi-Agent Orchestration

- **Task Analyzer**: Breaks down complex tasks into subtasks
- **Research Agent**: Gathers and analyzes information
- **Synthesis Agent**: Combines findings into coherent responses
- **Validation Agent**: Ensures accuracy and completeness

### 🎤 Advanced Voice Transcription

- **Streaming Transcription**: Real-time speech-to-text conversion
- **Multi-language Support**: English, Spanish, French, German
- **Enhanced Sensitivity**: Configurable audio processing
- **Auto-stop Detection**: Intelligent silence detection

### 📄 Document Ingestion Widget

- **Multi-format Support**: PDF, DOCX, TXT, Markdown, JSON
- **Intelligent Chunking**: Semantic document segmentation
- **Quality Analysis**: Document quality scoring and suggestions
- **Tagging System**: Automated content categorization

### 📊 Evaluation Pipeline

- **Response Quality Metrics**: Relevance, completeness, accuracy
- **Performance Analytics**: Response time, throughput analysis
- **A/B Testing**: Compare different RAG configurations
- **Recommendation Engine**: Optimization suggestions

### 🔐 Web3 Integration

- **Agent Factory**: Deploy AI agents as smart contracts
- **Tokenization**: AI agent tokenization and trading
- **DAO Governance**: Decentralized agent management
- **Trust Graph**: Reputation and trust scoring system

---

## 🏗️ Architecture

```
CuttleFish/
├── 🐙 Core RAG System
│   ├── Semantic Re-ranking Engine
│   ├── Multi-provider LLM Integration
│   └── FAISS Vector Database
├── 🤖 Multi-Agent Orchestration
│   ├── Task Analyzer
│   ├── Research Agent
│   ├── Synthesis Agent
│   └── Validation Agent
├── 🎤 Voice Processing
│   ├── Streaming Transcription
│   ├── Audio Processing
│   └── Multi-language Support
├── 📄 Document Management
│   ├── Ingestion Pipeline
│   ├── Quality Analysis
│   └── Knowledge Base
├── 📊 Evaluation System
│   ├── Quality Metrics
│   ├── Performance Analytics
│   └── A/B Testing
└── 🔐 Web3 Infrastructure
    ├── Agent Factory
    ├── Tokenization
    └── Trust Graph
```

### Technology Stack

**Backend:**
- **FastAPI**: High-performance web framework
- **FAISS**: Efficient similarity search
- **OpenAI/Gemini/xAI**: LLM providers
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

**Frontend:**
- **Next.js 13+**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Shadcn/ui**: Component library

**AI/ML:**
- **Scikit-learn**: TF-IDF and similarity metrics
- **NumPy**: Numerical computing
- **Pandas**: Data manipulation
- **Transformers**: NLP models

---

## 🔧 Setup & Configuration

### Backend Configuration

```python
# rag_fastapi.py
LLM_PROVIDER = "openai"  # openai | gemini | xai
EMBEDDINGS_PROVIDER = "openai"
BATCH_SIZE = 100
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
```

### Frontend Configuration

```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individually
docker build -f deployment/backend.Dockerfile -t cuttlefish-backend .
docker build -f deployment/frontend.Dockerfile -t cuttlefish-frontend .
```

---

## 📖 API Documentation

### Core RAG Endpoints

```http
POST /api/chat
Content-Type: application/json

{
  "question": "What is the main topic?",
  "mode": "enhanced"
}
```

### Multi-Agent Orchestration

```http
POST /api/orchestrate
Content-Type: application/json

{
  "task": "Analyze market trends",
  "context": "Financial data analysis",
  "agents": ["research", "synthesis", "validation"]
}
```

### Document Ingestion

```http
POST /api/documents/ingest
Content-Type: multipart/form-data

{
  "file": "document.pdf",
  "tags": ["finance", "analysis"],
  "type": "pdf"
}
```

### Voice Transcription

```http
POST /api/transcribe/stream
Content-Type: multipart/form-data

{
  "audio": "recording.webm",
  "language": "en-US",
  "model": "whisper-1"
}
```

### Evaluation Pipeline

```http
POST /api/evaluate
Content-Type: application/json

{
  "query": "Test question",
  "response": "AI response",
  "expected": "Expected answer"
}
```

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
python -m pytest

# Run frontend tests
cd frontend
npm test

# Run integration tests
npm run test:integration
```

---

## 📈 Performance Metrics

- **Response Time**: < 2 seconds average
- **Accuracy**: > 95% on standard benchmarks
- **Throughput**: 100+ concurrent requests
- **Memory Usage**: < 4GB RAM
- **Storage**: Efficient FAISS indexing

---

## 🔒 Security

- **API Key Management**: Secure environment variable handling
- **Input Validation**: Pydantic model validation
- **Rate Limiting**: Request throttling
- **CORS Configuration**: Cross-origin resource sharing
- **Content Filtering**: Malicious input detection

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/Cuttlefish-Repo-AI.git
cd Cuttlefish-Repo-AI

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### Code Style

- **Python**: Black, flake8, mypy
- **TypeScript**: ESLint, Prettier
- **Commit Messages**: Conventional Commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT models and embeddings
- **Google** for Gemini AI
- **xAI** for Grok models
- **FAISS** for efficient similarity search
- **FastAPI** for the excellent web framework
- **Next.js** for the React framework

---

## 📞 Support

- **Documentation**: [Wiki](https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI/wiki)
- **Issues**: [GitHub Issues](https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI/discussions)
- **Email**: support@cuttlefish.ai

---

<div align="center">

**Made with ❤️ by the CuttleFish Team**

[![GitHub stars](https://img.shields.io/github/stars/KryptoAliAhmed/Cuttlefish-Repo-AI?style=social)](https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI)
[![GitHub forks](https://img.shields.io/github/forks/KryptoAliAhmed/Cuttlefish-Repo-AI?style=social)](https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI)
[![GitHub issues](https://img.shields.io/github/issues/KryptoAliAhmed/Cuttlefish-Repo-AI)](https://github.com/KryptoAliAhmed/Cuttlefish-Repo-AI/issues)

</div>
