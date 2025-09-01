"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Download,
  Share,
  Settings,
  Sparkles,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Slider
} from "@/components/ui/slider"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"

interface TranscriptionChunk {
  partial: string
  final: string
  timestamp: number
  confidence: number
}

interface TranscriptionSession {
  id: string
  startTime: number
  endTime?: number
  chunks: TranscriptionChunk[]
  finalText: string
  status: 'recording' | 'processing' | 'completed' | 'error'
  language: string
  model: string
}

export function EnhancedVoiceTranscription() {
  const [mounted, setMounted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentSession, setCurrentSession] = useState<TranscriptionSession | null>(null)
  const [sessions, setSessions] = useState<TranscriptionSession[]>([])
  const [transcriptionText, setTranscriptionText] = useState("")
  const [partialText, setPartialText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    language: 'en-US',
    model: 'whisper-1',
    sensitivity: 0.7,
    autoStop: true,
    autoStopDelay: 3000
  })
  const [showSettings, setShowSettings] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })
      
      streamRef.current = stream
      chunksRef.current = []
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstart = () => {
        setIsRecording(true)
        setIsProcessing(false)
        
        // Create new session
        const session: TranscriptionSession = {
          id: `session_${Date.now()}`,
          startTime: Date.now(),
          chunks: [],
          finalText: "",
          status: 'recording',
          language: settings.language,
          model: settings.model
        }
        
        setCurrentSession(session)
        setTranscriptionText("")
        setPartialText("")
        
        // Start streaming transcription
        startStreamingTranscription(session.id)
      }
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false)
        setIsProcessing(true)
        
        if (currentSession) {
          setCurrentSession(prev => prev ? { ...prev, status: 'processing' } : null)
        }
        
        try {
          // Get final transcription
          const finalText = await getFinalTranscription()
          setTranscriptionText(finalText)
          
          // Update session
          if (currentSession) {
            const completedSession: TranscriptionSession = {
              ...currentSession,
              endTime: Date.now(),
              finalText: finalText,
              status: 'completed'
            }
            
            setSessions(prev => [completedSession, ...prev])
            setCurrentSession(null)
          }
          
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Transcription failed')
          if (currentSession) {
            setCurrentSession(prev => prev ? { ...prev, status: 'error' } : null)
          }
        } finally {
          setIsProcessing(false)
        }
      }
      
      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [settings, currentSession])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current)
      autoStopTimeoutRef.current = null
    }
  }, [isRecording])

  const startStreamingTranscription = async (sessionId: string) => {
    try {
      // This would connect to a WebSocket or Server-Sent Events endpoint
      // For now, we'll simulate streaming transcription
      
      const simulateStreaming = () => {
        if (!isRecording) return
        
        // Simulate partial transcription
        const partialWords = [
          "Hello", "this", "is", "a", "test", "of", "the", "streaming", "transcription",
          "system", "it", "should", "work", "in", "real", "time", "as", "you", "speak"
        ]
        
        const randomWords = partialWords
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 5) + 1)
          .join(" ")
        
        setPartialText(prev => prev + " " + randomWords)
        
        // Schedule next update
        setTimeout(simulateStreaming, 2000)
      }
      
      simulateStreaming()
      
    } catch (err) {
      console.error('Streaming transcription error:', err)
    }
  }

  const getFinalTranscription = async (): Promise<string> => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')
      
      const response = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.text || "No transcription available"
      
    } catch (err) {
      console.error('Final transcription error:', err)
      return "Transcription failed"
    }
  }

  const handleAutoStop = useCallback(() => {
    if (!settings.autoStop || !isRecording) return
    
    lastActivityRef.current = Date.now()
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current)
    }
    
    autoStopTimeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (timeSinceLastActivity >= settings.autoStopDelay && isRecording) {
        stopRecording()
      }
    }, settings.autoStopDelay)
  }, [settings.autoStop, settings.autoStopDelay, isRecording, stopRecording])

  // Auto-stop effect
  useEffect(() => {
    if (isRecording && settings.autoStop) {
      handleAutoStop()
    }
    
    return () => {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current)
      }
    }
  }, [isRecording, settings.autoStop, handleAutoStop])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcriptionText)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadTranscription = () => {
    const blob = new Blob([transcriptionText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcription_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSessionDuration = (session: TranscriptionSession) => {
    const endTime = session.endTime || Date.now()
    const duration = endTime - session.startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: TranscriptionSession['status']) => {
    switch (status) {
      case 'recording':
        return <Mic className="w-4 h-4 text-red-500 animate-pulse" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Mic className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: TranscriptionSession['status']) => {
    switch (status) {
      case 'recording':
        return <Badge className="bg-red-100 text-red-800">Recording</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Recording Card */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
            <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span>Enhanced Voice Transcription</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Sparkles className="w-3 h-3 mr-1" /> Streaming
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse' 
                  : 'bg-gradient-to-br from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
              }`}
            >
              {isRecording ? (
                <Square className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </Button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {isRecording ? "Recording..." : "Ready"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isRecording ? "Click to stop" : "Click to start"}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Language
                  </label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value: string) => setSettings(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model
                  </label>
                  <Select 
                    value={settings.model} 
                    onValueChange={(value: string) => setSettings(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper-1">Whisper v1</SelectItem>
                      <SelectItem value="whisper-2">Whisper v2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-stop delay: {settings.autoStopDelay / 1000}s
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.autoStop}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoStop: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                <Slider
                  value={[settings.autoStopDelay]}
                  onValueChange={([value]: number[]) => setSettings(prev => ({ ...prev, autoStopDelay: value }))}
                  min={1000}
                  max={10000}
                  step={500}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Live Transcription Display */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Live Transcription
              </span>
              {isRecording && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-500">LIVE</span>
                </div>
              )}
            </div>
            
            <div className="min-h-[120px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {partialText && (
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  <span className="text-xs font-medium">Partial:</span>
                  <div className="text-sm italic">{partialText}</div>
                </div>
              )}
              
              {transcriptionText && (
                <div className="text-gray-800 dark:text-gray-200">
                  <span className="text-xs font-medium">Final:</span>
                  <div className="text-sm">{transcriptionText}</div>
                </div>
              )}
              
              {!partialText && !transcriptionText && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {isRecording ? "Listening..." : "Start recording to see transcription"}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {transcriptionText && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{transcriptionText.length} characters</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Share className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTranscription}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions History */}
      {sessions.length > 0 && (
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
              Transcription History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      {getStatusIcon(session.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        Session {session.id.split('_')[1]}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{getSessionDuration(session)}</span>
                        <span>{session.finalText.length} chars</span>
                        <span>{mounted ? new Date(session.startTime).toLocaleTimeString() : 'Loading...'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(session.status)}
                    {session.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTranscriptionText(session.finalText)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedVoiceTranscription
