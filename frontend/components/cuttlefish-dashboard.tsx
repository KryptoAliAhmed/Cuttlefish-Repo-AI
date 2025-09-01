"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KernelWeights } from "@/components/kernel-weights"
import { RAGChat } from "@/components/rag-chat"
import { chatPersistence } from "@/lib/chat-persistence"
import { MockBuilderAgentFactoryCWA } from "@/lib/agent-factory-mock"
import { Bot, Zap, Loader2, Brain, FileText, Mic, Sparkles, Cpu, Target, Send, Download, Trash2, MessageSquare, X } from "lucide-react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"

// Dynamically import the 3D animation components
const Cuttlefish3DAnimation = dynamic(() => import("@/components/cuttlefish-3d-animation"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gradient-to-br from-blue-800 to-blue-600 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Loading 3D Animation...</p>
      </div>
    </div>
  )
})

interface RAGStatus {
  documents_loaded: number
  index_ready: boolean
  pdf_files: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  source?: string
  confidence?: number
}

export function CuttlefishDashboard() {
  
  // RAG State
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null)
  const [isRagConnected, setIsRagConnected] = useState(false)
  const [kernelValues, setKernelValues] = useState<{ financial: number; ecological: number; social: number }>({ financial: 0, ecological: 0, social: 0 })
  
  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>("")

  // 3D Animation State
  const [show3DAnimation, setShow3DAnimation] = useState(false)
  const [isRecording3D, setIsRecording3D] = useState(false)
  const [voiceChatHistory, setVoiceChatHistory] = useState<Array<{
    id: string
    userQuestion: string
    agentAnswer: string
    timestamp: Date
  }>>([])
  const [ragChatKey, setRagChatKey] = useState(0)

  // Handle voice mode exit and show chat history
  const handleVoiceModeExit = (history: Array<{
    id: string
    userQuestion: string
    agentAnswer: string
    timestamp: Date
  }>) => {
    setShow3DAnimation(false)
    setIsRecording3D(false)
    setVoiceChatHistory(history)
    console.log('📝 Voice conversation ended, showing chat history:', history.length, 'messages')

    // Persist transcript server-side for audit/history (no live UI during session)
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
      fetch(`${API}/voice/transcripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_name: `Voice Chat — ${new Date().toLocaleString()}`,
          entries: history.map(h => ({
            userQuestion: h.userQuestion,
            agentAnswer: h.agentAnswer,
            timestamp: h.timestamp?.toISOString?.() || new Date().toISOString()
          }))
        })
      }).catch(() => {})
    } catch {}

    // Save transcript to a new chat session for RAGChat sidebar
    try {
      const sessionName = `Voice Chat — ${new Date().toLocaleString()}`
      chatPersistence.createSession(sessionName)
      for (const entry of history) {
        if (entry.userQuestion?.trim()) {
          chatPersistence.addMessage({ role: 'user', content: entry.userQuestion })
        }
        if (entry.agentAnswer?.trim()) {
          chatPersistence.addMessage({ role: 'assistant', content: entry.agentAnswer })
        }
      }
      // Force RAGChat to remount and pick up the new session
      setRagChatKey((k) => k + 1)
    } catch (e) {
      console.error('Failed to save voice transcript to chat sessions:', e)
    }
  }

  // Initialize agent factory
  const agentFactory = new MockBuilderAgentFactoryCWA()

  useEffect(() => {
    checkRAGStatus()
    loadChatHistory()
  }, [])

  const checkRAGStatus = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
      const response = await fetch(`${API}/api/status`)
      if (response.ok) {
        const status = await response.json()
        setRagStatus(status)
        setIsRagConnected(true)
      } else {
        setIsRagConnected(false)
      }
    } catch (error) {
      console.error("Failed to connect to RAG service:", error)
      setIsRagConnected(false)
    }
  }

  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem('cuttlefish_chat_history')
      if (saved) {
        setChatHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const addChatMessage = (role: 'user' | 'assistant', content: string, source?: string, confidence?: number) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      source,
      confidence
    }
    
    const updatedHistory = [...chatHistory, newMessage]
    setChatHistory(updatedHistory)
    saveChatHistory(updatedHistory)
    return newMessage
  }

  const saveChatHistory = (history: ChatMessage[]) => {
    try {
      localStorage.setItem('cuttlefish_chat_history', JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  const clearChatHistory = () => {
    setChatHistory([])
    localStorage.removeItem('cuttlefish_chat_history')
  }

  const exportChatHistory = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      chatHistory: chatHistory,
      ragStatus: ragStatus
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuttlefish_chat_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 3D voice entry point retained; chat now has inline mic
  const handleVoiceIconClick = () => {
    if (!show3DAnimation) {
      setShow3DAnimation(true)
      setIsRecording3D(true)
    } else {
      setShow3DAnimation(false)
      setIsRecording3D(false)
    }
  }

  // Voice recording/transcription (Whisper) → set as query
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Auto-stop recording after silence detection
  const startSilenceDetection = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    
    // Stop recording after 3 seconds of silence
    silenceTimerRef.current = setTimeout(() => {
      if (isRecording) {
        handleStopRecording()
      }
    }, 3000)
  }

  // Start recording with enhanced functionality
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream
      chunksRef.current = []
      setRecordingTime(0)
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstart = () => {
        setIsRecording(true)
        setIsProcessing(false)
        setShowVoiceOverlay(true)
        
        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        
        // Start silence detection
        startSilenceDetection()
      }

      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true)
          const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        
          // Stop tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
          }

          // Send to backend for transcription
          const form = new FormData()
          form.append("file", blob, "recording.webm")
        
          const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
          const resp = await fetch(`${API}/api/transcribe`, {
            method: "POST",
            body: form
          })
        
          if (!resp.ok) {
            console.error("Transcription failed", await resp.text())
            setIsProcessing(false)
            return
          }
        
          const data = await resp.json()
          const text = data?.text || ""
        
          if (text) {
            // Auto-play success sound (optional)
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
              const oscillator = audioContext.createOscillator()
              const gainNode = audioContext.createGain()
              
              oscillator.connect(gainNode)
              gainNode.connect(audioContext.destination)
              
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
              oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1)
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
              
              gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
              
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.3)
            } catch (e) {
              console.log("Audio feedback not supported")
            }
          }
        } catch (err) {
          console.error("Error finalizing recording:", err)
        } finally {
          setIsProcessing(false)
          setIsRecording(false)
          setShowVoiceOverlay(false)
          setRecordingTime(0)
          mediaRecorderRef.current = null
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
    
    } catch (err) {
      console.error("Mic access/recording error:", err)
      setIsRecording(false)
      setIsProcessing(false)
      setRecordingTime(0)
      mediaRecorderRef.current = null
    }
  }

  // Stop recording manually
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    // Clear timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setShowVoiceOverlay(false)
  }

  // Toggle recording (start/stop)
  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording()
    } else {
      handleStartRecording()
    }
  }

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Handle full screen mode
  useEffect(() => {
    if (show3DAnimation) {
      // Prevent body scrolling when in full screen
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scrolling when exiting full screen
      document.body.style.overflow = 'auto'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [show3DAnimation])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-lg shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cuttlefish Agent Factory
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={isRagConnected ? "outline" : "destructive"} className={`px-3 py-1 ${isRagConnected ? "border-purple-500/50 text-purple-300" : ""}`}>
                {isRagConnected ? "RAG Connected" : "RAG Disconnected"}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-sm text-purple-200/80">
            An intelligent dashboard for executing and monitoring AI-powered Builder Agents with RAG-enhanced knowledge retrieval
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Kernel Weights Section */}
        <div className="mb-8">
          <Card className="border border-purple-500/20 bg-black/40 backdrop-blur-sm shadow-2xl">
            <CardHeader className="bg-purple-500/10 border-b border-purple-500/20">
              <CardTitle className="text-lg font-semibold text-purple-300">
                Kernel Weights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <KernelWeights values={kernelValues} />
            </CardContent>
          </Card>
        </div>

        {/* 3D Animation Display - True Full Screen Mode */}
        {show3DAnimation && createPortal(
          <div className="fixed inset-0 z-[2147483647] bg-blue-900 w-screen h-screen">
            <div className="w-full h-full relative">
              {/* Header with Close Button */}
              <div className="absolute top-4 right-4 z-[10000]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsRecording3D(false)
                    setShow3DAnimation(false)
                    if (voiceChatHistory.length > 0) {
                      console.log('📝 Showing existing chat history:', voiceChatHistory.length, 'messages')
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0 backdrop-blur-sm border border-white/20 shadow-lg"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              {/* 3D Animation Canvas - Full Screen */}
              <div className="w-screen h-screen">
                <Cuttlefish3DAnimation 
                  isRecording={isRecording3D} 
                  onExit={(history) => handleVoiceModeExit(history)}
                />
              </div>
            </div>
          </div>, document.body
        )}

        {/* Voice Chat History Display removed per requirement */}

        {/* Main Chat Interface */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-500/20 overflow-hidden">
          <RAGChat key={ragChatKey} onKernelScores={(k) => setKernelValues(k)} onOpenVoiceMode={() => {
            setShow3DAnimation(true)
            setIsRecording3D(true)
          }} />
        </div>
        {showVoiceOverlay && createPortal(
          <div className="fixed inset-0 z-[2147483647]">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative z-[10001] w-screen h-screen p-4 sm:p-6 flex items-center justify-center">
              <div className="relative w-full max-w-3xl rounded-2xl border border-purple-500/30 bg-black/60 backdrop-blur-md shadow-2xl p-6">
                <button
                  onClick={handleStopRecording}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5 mx-auto" />
                </button>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-indigo-600'} w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl`}>
                    <Mic className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-semibold text-white">
                    {isProcessing ? 'Processing your audio…' : isRecording ? 'Listening…' : 'Voice mode'}
                  </div>
                  <div className="text-sm text-purple-200/80 max-w-xl">
                    Speak naturally. We’ll transcribe and insert your words automatically.
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <Button onClick={handleStopRecording} className="px-4 py-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white shadow hover:shadow-lg">
                      Stop recording
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>, document.body
        )}
      </main>
    </div>
  )
}

// User icon component
const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)