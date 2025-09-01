# CuttleFish Project - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ and pip
- **Git** for version control
- **Docker** (optional, for containerized deployment)

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd CuttleFish-Update

# Install all dependencies
npm run install:all
```

### Step 2: Configure Environment
```bash
# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env and add your API keys:
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here  # Optional
XAI_API_KEY=your_xai_key_here        # Optional
RAG_API_KEY=test-api-key
```

### Step 3: Start the Services
```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:frontend  # Frontend on port 3000
npm run dev:backend   # Backend on port 5002
```

### Step 4: Access the Application
- **Main Dashboard**: http://localhost:3000
- **3D Widget**: http://localhost:3000 (separate route)
- **API Documentation**: http://localhost:5002/docs
- **Health Check**: http://localhost:5002/health

## 📁 Project Structure Quick Reference

```
CuttleFish-Update/
├── frontend/                 # Next.js React application
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── contracts/           # Solidity smart contracts
│   └── package.json
├── backend/                  # FastAPI Python backend
│   ├── rag_fastapi.py       # Main API server
│   ├── start_fastapi.py     # Startup script
│   └── requirements.txt
├── widget/                   # Standalone 3D widget
├── repos/builder-ai-agent/   # Agent simulation sandbox
└── docker-compose.yml        # Container orchestration
```

## 🎯 Quick Test

### 1. Test the Backend
```bash
# Check if backend is running
curl http://localhost:5002/api/status

# Expected response:
{
  "documents_loaded": 0,
  "index_ready": false,
  "files": [],
  "api_configured": true
}
```

### 2. Test the Frontend
- Open http://localhost:3000
- You should see the main dashboard
- Try clicking the voice button to test microphone access

### 3. Upload a Document
```bash
# Upload a test document
curl -X POST http://localhost:5002/rag/documents \
  -H "Authorization: Bearer test-api-key" \
  -F "file=@your_document.pdf" \
  -F "tag=test"
```

### 4. Ask a Question
- In the chat interface, type: "What documents have been uploaded?"
- The system should respond with information about your documents

## 🔧 Common Commands

### Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Backend Specific
```bash
# Start backend only
cd backend
python start_fastapi.py

# Install Python dependencies
pip install -r requirements.txt

# Run backend tests
python -m pytest
```

### Frontend Specific
```bash
# Start frontend only
cd frontend
npm run dev

# Build frontend
npm run build

# Run frontend tests
npm run test
```

### Docker
```bash
# Start with Docker Compose
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check if Python dependencies are installed
pip list | grep fastapi

# Check if the test directory exists
ls -la backend/test/

# Restart the backend
pkill -f "python start_fastapi.py"
python backend/start_fastapi.py
```

### Frontend Issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev

# Check if ports are available
lsof -i :3000
lsof -i :5002

# Kill processes using ports
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:5002)
```

### API Connection Issues
```bash
# Test API connectivity
curl -v http://localhost:5002/api/status

# Check CORS settings
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:5002/api/chat
```

## 📊 Monitoring

### Health Checks
- **Backend Health**: http://localhost:5002/health
- **API Status**: http://localhost:5002/api/status
- **Documentation**: http://localhost:5002/docs

### Logs
```bash
# Backend logs
tail -f backend/rag_pipeline.log

# Frontend logs (in browser console)
# Open Developer Tools (F12) and check Console tab

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔐 Security Notes

### Development Environment
- API keys are stored in `.env` files (never commit these)
- CORS is set to allow all origins in development
- Authentication is minimal for development

### Production Considerations
- Set up proper CORS restrictions
- Implement user authentication
- Use HTTPS for all communications
- Secure API key management
- Regular security updates

## 🚀 Next Steps

### For Users
1. Upload your first document
2. Try asking questions about the document
3. Test voice interaction
4. Explore the 3D widget
5. Check out the project scoring features

### For Developers
1. Review the technical implementation guide
2. Explore the API documentation
3. Check out the blockchain integration
4. Experiment with the agent sandbox
5. Contribute to the codebase

### For Deployment
1. Set up production environment variables
2. Configure proper CORS settings
3. Set up monitoring and logging
4. Deploy with Docker Compose
5. Set up SSL certificates

## 📞 Support

### Documentation
- **Project Overview**: `report/project-overview.md`
- **Technical Guide**: `report/technical-implementation.md`
- **API Documentation**: http://localhost:5002/docs

### Common Issues
- **Port conflicts**: Change ports in configuration files
- **API key errors**: Check environment variables
- **Document upload fails**: Verify file format and size
- **Voice not working**: Check microphone permissions

### Getting Help
- Check the troubleshooting section above
- Review the logs for error messages
- Consult the technical documentation
- Open an issue in the repository

---

*This quick start guide gets you up and running with CuttleFish in minutes. For detailed information, refer to the full project documentation.*

