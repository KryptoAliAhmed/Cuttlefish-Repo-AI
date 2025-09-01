# CuttleFish Project - Technical Implementation Guide

## System Architecture Overview

### Technology Stack

**Frontend:**
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **3D Graphics**: React Three Fiber + Three.js
- **State Management**: React hooks + local storage
- **Build Tool**: Vite (for agent sandbox)

**Backend:**
- **Framework**: FastAPI (Python 3.8+)
- **Server**: Uvicorn (ASGI)
- **AI Integration**: OpenAI SDK, Google Generative AI, xAI
- **Vector Search**: FAISS (Facebook AI Similarity Search)
- **Document Processing**: PyPDF2, pdfplumber, python-docx, python-pptx
- **OCR**: pytesseract + Pillow
- **Audio**: OpenAI Whisper

**Infrastructure:**
- **Containerization**: Docker + Docker Compose
- **Blockchain**: Solidity + Hardhat (Arbitrum)
- **Version Control**: Git
- **Package Management**: npm (frontend), pip (backend)

## Backend Implementation Details

### FastAPI Server (`backend/rag_fastapi.py`)

#### Core Components

1. **RAG Pipeline**
   ```python
   def answer_question(question: str, mode: Optional[str] = None):
       # 1. Generate question embedding
       question_embedding = get_embeddings([question])
       
       # 2. Search FAISS index
       D, I = index.search(np.array(question_embedding), k=3)
       
       # 3. Retrieve relevant documents
       relevant_docs = [documents[i] for i in I[0]]
       
       # 4. Combine context and send to LLM
       combined_context = "\n\n".join(relevant_docs)
       
       # 5. Generate response with professional formatting
       response = llm.generate(combined_context + question)
       
       return response, source, confidence
   ```

2. **Document Processing**
   ```python
   def process_file(file_path: str) -> str:
       ext = Path(file_path).suffix.lower()
       
       if ext == '.pdf':
           return process_pdf(file_path)  # OCR fallback
       elif ext == '.docx':
           return process_docx(file_path)
       elif ext == '.pptx':
           return process_pptx(file_path)
       # ... other formats
   ```

3. **Embedding Generation**
   ```python
   def get_embeddings(texts: List[str]) -> List[List[float]]:
       if EMBEDDINGS_PROVIDER == "openai":
           response = client.embeddings.create(
               model=EMBEDDING_MODEL,
               input=texts
           )
           return [embedding.embedding for embedding in response.data]
   ```

#### API Endpoints

1. **Chat Endpoint**
   ```python
   @app.post("/api/chat", response_model=ChatResponse)
   async def chat_api(request: ChatRequest):
       answer, source, distance = answer_question(request.question, request.mode)
       confidence = 1 / (1 + distance) if distance != 0 else 1.0
       
       return ChatResponse(
           answer=answer,
           source=source,
           confidence=float(confidence),
           distance=float(distance)
       )
   ```

2. **Document Upload**
   ```python
   @app.post("/rag/documents", response_model=DocumentUploadResponse)
   async def rag_documents_upload(
       file: UploadFile = File(...),
       tag: str = Form("general"),
       flag: str = Form(""),
       api_key: str = Depends(verify_api_key)
   ):
       # Process and chunk document
       text = process_file(save_path)
       chunks = chunk_text(text)
       
       # Add to documents and update index
       documents.extend(chunks)
       embed_and_index()
   ```

3. **Voice Transcription**
   ```python
   @app.post("/api/transcribe")
   async def transcribe_audio(file: UploadFile = File(...)):
       result = client.audio.transcriptions.create(
           model="whisper-1",
           file=audio_f
       )
       return {"text": result.text}
   ```

### Data Storage

1. **Document Storage**
   - `./test/` directory for uploaded files
   - `docs.pkl` for document chunks and sources
   - `index.faiss` for vector search index

2. **Audit Logging**
   ```python
   class TrustGraph:
       def append_action(self, action):
           action['timestamp'] = time.time()
           with open(self.filename, 'a') as f:
               f.write(json.dumps(action) + '\n')
   ```

3. **Voice Transcripts**
   ```python
   @app.post("/voice/transcripts")
   async def save_voice_transcript(payload: VoiceTranscriptRequest):
       session = {
           "session_name": payload.session_name,
           "timestamp": time.time(),
           "entries": payload.entries
       }
       with open(VOICE_LOG_FILE, "a") as f:
           f.write(json.dumps(session) + "\n")
   ```

## Frontend Implementation Details

### Main Dashboard (`frontend/app/page.tsx`)

#### Component Structure

1. **RAG Chat Component**
   ```typescript
   export function RAGChat({ onOpenVoiceMode }: { onOpenVoiceMode?: () => void }) {
     const [messages, setMessages] = useState<ChatMessage[]>([])
     const [isSending, setIsSending] = useState(false)
     const [isConnected, setIsConnected] = useState<boolean | null>(null)
     
     // Voice recording state
     const [isRecording, setIsRecording] = useState(false)
     const mediaRecorderRef = useRef<MediaRecorder | null>(null)
   ```

2. **Session Management**
   ```typescript
   const createNewChat = () => {
     const id = chatPersistence.createSession()
     const updated = chatPersistence.getAllSessions()
     setSessions(updated)
   }
   
   const selectSession = (sessionId: string) => {
     if (chatPersistence.setCurrentSession(sessionId)) {
       const current = chatPersistence.getCurrentSession()
       setCurrentSession(current)
       setMessages(chatPersistence.getMessages())
     }
   }
   ```

3. **Voice Integration**
   ```typescript
   const startRecording = async () => {
     const stream = await navigator.mediaDevices.getUserMedia({ 
       audio: { echoCancellation: true, noiseSuppression: true } 
     })
     
     const mediaRecorder = new MediaRecorder(stream, { 
       mimeType: 'audio/webm;codecs=opus' 
     })
     
     mediaRecorder.ondataavailable = (e) => {
       if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
     }
   }
   ```

### 3D Widget Implementation

#### React Three Fiber Setup
```typescript
export default function CuttlefishWidget() {
  const [state, setState] = useState("idle")
  const mouse = useRef({ x: 0, y: 0 })

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Suspense fallback={null}>
          <CuttlefishModel mouse={mouse.current} globalState={state} />
          <Environment preset="night" />
          <OrbitControls enablePan={false} enableZoom={true} />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

#### Custom Shader Effects
```typescript
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec2 mouse;
  uniform float state;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vec3 color = vec3(0.0);
    
    // Rainbow effect based on state
    float hue = mod(time * 0.5 + state * 0.2, 1.0);
    color = hsv2rgb(vec3(hue, 0.8, 0.9));
    
    gl_FragColor = vec4(color, 1.0);
  }
`
```

### State Management

#### Chat Persistence (`lib/chat-persistence.ts`)
```typescript
class ChatPersistence {
  private storageKey = 'cuttlefish_chat_sessions'
  private currentSessionKey = 'cuttlefish_current_session'
  
  getAllSessions(): ChatSession[] {
    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return []
    
    const sessions = JSON.parse(stored)
    return sessions.map((s: any) => ({
      ...s,
      messages: s.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }))
    }))
  }
  
  createSession(): string {
    const id = generateId()
    const session: ChatSession = {
      id,
      name: `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date()
    }
    
    const sessions = this.getAllSessions()
    sessions.push(session)
    localStorage.setItem(this.storageKey, JSON.stringify(sessions))
    
    return id
  }
}
```

## Blockchain Integration

### Smart Contracts

#### Multi-Signature Wallet (`contracts/CreatorMultiSig.sol`)
```solidity
contract CreatorMultiSig {
    mapping(address => bool) public isOwner;
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    
    event Confirmation(address indexed sender, bytes32 indexed transactionId);
    event Revocation(address indexed sender, bytes32 indexed transactionId);
    event Submission(bytes32 indexed transactionId);
    event Execution(bytes32 indexed transactionId);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }
    
    function submitTransaction(
        address destination,
        uint value,
        bytes memory data
    ) public onlyOwner returns (bytes32 transactionId) {
        transactionId = addTransaction(destination, value, data);
        confirmTransaction(transactionId);
    }
    
    function confirmTransaction(bytes32 transactionId) public onlyOwner {
        require(confirmations[transactionId][msg.sender] == false, "Already confirmed");
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }
}
```

### Deployment Scripts

#### Arbitrum Deployment (`scripts/migrateToArbitrum.js`)
```javascript
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy CreatorMultiSig
  const CreatorMultiSig = await ethers.getContractFactory("CreatorMultiSig");
  const multiSig = await CreatorMultiSig.deploy(owners, required);
  
  await multiSig.deployed();
  console.log("CreatorMultiSig deployed to:", multiSig.address);
  
  // Deploy other contracts...
  const CuttlefishVault = await ethers.getContractFactory("CuttlefishVault");
  const vault = await CuttlefishVault.deploy();
  
  await vault.deployed();
  console.log("CuttlefishVault deployed to:", vault.address);
}
```

## Environment Configuration

### Backend Environment Variables
```bash
# AI Provider Configuration
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
XAI_API_KEY=your_xai_key_here
XAI_BASE_URL=https://api.x.ai/v1

# Model Selection
LLM_PROVIDER=openai  # openai | gemini | xai
EMBEDDINGS_PROVIDER=openai

# Model Overrides
OPENAI_CHAT_MODEL=gpt-4
OPENAI_EMBED_MODEL=text-embedding-ada-002
GEMINI_CHAT_MODEL=gemini-1.5-flash
GEMINI_EMBED_MODEL=models/text-embedding-004
XAI_CHAT_MODEL=grok-2-latest

# Security
RAG_API_KEY=test-api-key

# System Configuration
CHUNK_SIZE=500
BATCH_SIZE=100
```

### Frontend Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5002
NEXT_PUBLIC_RAG_API_KEY=test-api-key

# Blockchain Configuration
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

## Deployment Configuration

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5002
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - cuttlefish-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5002:5002"
    environment:
      - RAG_API_KEY=test-api-key
    volumes:
      - ./backend:/app
      - ./test:/app/test
    networks:
      - cuttlefish-network

networks:
  cuttlefish-network:
    driver: bridge
```

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5002

CMD ["python", "start_fastapi.py"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Performance Optimization

### Backend Optimizations

1. **Batch Processing**
   ```python
   def embed_and_index():
       # Process embeddings in batches
       for i in range(0, len(documents), BATCH_SIZE):
           batch = documents[i:i + BATCH_SIZE]
           batch_embeddings = get_embeddings(batch)
           all_embeddings.extend(batch_embeddings)
   ```

2. **Caching**
   ```python
   @lru_cache(maxsize=1000)
   def get_cached_embedding(text: str) -> List[float]:
       return get_embeddings([text])[0]
   ```

3. **Async Processing**
   ```python
   @app.post("/api/chat")
   async def chat_api(request: ChatRequest):
       # Async processing for better performance
       answer, source, distance = await process_question_async(request.question)
       return ChatResponse(...)
   ```

### Frontend Optimizations

1. **Virtual Scrolling**
   ```typescript
   import { FixedSizeList as List } from 'react-window';
   
   const VirtualizedMessageList = ({ messages }) => (
     <List
       height={400}
       itemCount={messages.length}
       itemSize={80}
       itemData={messages}
     >
       {MessageRow}
     </List>
   );
   ```

2. **Memoization**
   ```typescript
   const MemoizedChatMessage = React.memo(({ message }) => (
     <div className="message">
       {message.content}
     </div>
   ));
   ```

3. **Lazy Loading**
   ```typescript
   const VoiceMode = lazy(() => import('./components/voice-mode'));
   
   function App() {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <VoiceMode />
       </Suspense>
     );
   }
   ```

## Security Considerations

### API Security
```python
# API Key Authentication
async def verify_api_key(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    api_key = authorization.split(" ", 1)[-1]
    if api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return api_key
```

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### Input Validation
```python
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    mode: Optional[str] = Field(None, regex="^(general|hybrid)$")
```

## Testing Strategy

### Backend Testing
```python
import pytest
from fastapi.testclient import TestClient
from rag_fastapi import app

client = TestClient(app)

def test_chat_endpoint():
    response = client.post("/api/chat", json={"question": "What is RAG?"})
    assert response.status_code == 200
    assert "answer" in response.json()

def test_document_upload():
    with open("test.pdf", "rb") as f:
        response = client.post(
            "/rag/documents",
            files={"file": f},
            headers={"Authorization": "Bearer test-api-key"}
        )
    assert response.status_code == 200
```

### Frontend Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import RAGChat from './rag-chat';

test('sends message when user types and presses enter', () => {
  render(<RAGChat />);
  
  const input = screen.getByPlaceholderText('Ask anything');
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Monitoring and Logging

### Structured Logging
```python
import logging
import json

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName
        }
        return json.dumps(log_entry)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rag_pipeline.log'),
        logging.StreamHandler()
    ]
)
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "rag": "operational",
            "llm": "operational" if client else "unavailable"
        }
    }
```

## Troubleshooting Guide

### Common Issues

1. **FAISS Index Issues**
   ```python
   # Rebuild index if corrupted
   if index is None or index.ntotal == 0:
       embed_and_index()
   ```

2. **Memory Management**
   ```python
   # Clear old documents periodically
   if len(documents) > MAX_DOCUMENTS:
       documents = documents[-MAX_DOCUMENTS:]
       embed_and_index()
   ```

3. **API Rate Limits**
   ```python
   import time
   
   def rate_limited_api_call(func):
       def wrapper(*args, **kwargs):
           time.sleep(0.1)  # Rate limiting
           return func(*args, **kwargs)
       return wrapper
   ```

### Debug Mode
```python
if DEBUG_MODE:
    logging.getLogger().setLevel(logging.DEBUG)
    app.debug = True
```

---

*This technical implementation guide provides detailed information for developers and technical stakeholders. For user-facing documentation, please refer to the project overview document.*

