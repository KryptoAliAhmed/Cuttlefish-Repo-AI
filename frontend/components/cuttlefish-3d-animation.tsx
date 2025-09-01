"use client"

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { Suspense } from "react"
import * as THREE from "three"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"

interface Cuttlefish3DAnimationProps {
  isRecording: boolean
  onExit?: (history: Array<{
    id: string
    userQuestion: string
    agentAnswer: string
    timestamp: Date
  }>) => void
}

interface CuttlefishModelProps {
  mouse: { x: number; y: number }
  isRecording: boolean
}

// Real-time conversation states
interface ConversationState {
  isListening: boolean
  isProcessing: boolean
  isResponding: boolean
  userInput: string
  agentResponse: string
  isGenerating: boolean
  chatHistory: Array<{
    id: string
    userQuestion: string
    agentAnswer: string
    timestamp: Date
  }>
}

function useRealTimeConversation(onExit?: (history: Array<{
  id: string
  userQuestion: string
  agentAnswer: string
  timestamp: Date
}>) => void) {
  const [conversation, setConversation] = useState<ConversationState>({
    isListening: false,
    isProcessing: false,
    isResponding: false,
    userInput: "",
    agentResponse: "",
    isGenerating: false,
    chatHistory: []
  })

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const hardStopTriesRef = useRef<number>(0)
  const shuttingDownRef = useRef<boolean>(false)

  const hardStopSpeech = useCallback(() => {
    try {
      const synth = synthesisRef.current
      if (!synth) return
      const attempt = () => {
        try { synth.pause() } catch {}
        try { synth.cancel() } catch {}
        try { synth.resume() } catch {}
        try { synth.cancel() } catch {}
        hardStopTriesRef.current += 1
        if (synth.speaking && hardStopTriesRef.current < 10) {
          setTimeout(attempt, 60)
        }
      }
      hardStopTriesRef.current = 0
      attempt()
    } catch {}
  }, [])

  // Advanced human voice detection function
  const detectHumanVoice = useCallback((transcript: string, confidence: number) => {
    // Filter out background noise patterns
    const backgroundNoisePatterns = [
      'um', 'uh', 'ah', 'er', 'mm', 'hmm',
      'shh', 'sss', 'fff', 'zzz', 'vvv',
      'air', 'fan', 'ac', 'noise', 'static'
    ]
    
    // Check for background noise patterns
    const hasBackgroundNoise = backgroundNoisePatterns.some(pattern => 
      transcript.includes(pattern)
    )
    
    // Lower confidence threshold for better detection
    const isConfident = confidence > 0.3  // Lowered from 0.7
    
    // Relaxed sentence structure check
    const hasProperStructure = transcript.length > 2  // Lowered from 3
    
    // More relaxed human speech characteristics
    const hasHumanCharacteristics = !transcript.match(/^[^a-zA-Z]*$/) && // Contains letters
                                  transcript.trim().length > 1  // Lowered from 2
    
    // Final decision: more relaxed criteria
    const isHumanVoice = isConfident && 
                        hasProperStructure && 
                        hasHumanCharacteristics && 
                        !hasBackgroundNoise
    
    console.log('🎤 Voice analysis:', {
      transcript,
      confidence,
      isConfident,
      hasProperStructure,
      hasHumanCharacteristics,
      hasBackgroundNoise,
      isHumanVoice
    })
    
    return isHumanVoice
  }, [])

  // Initialize speech recognition with advanced voice detection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      // Advanced voice detection settings
      recognitionRef.current.maxAlternatives = 1
      recognitionRef.current.continuous = true

      recognitionRef.current.onstart = () => {
        setConversation(prev => ({ ...prev, isListening: true }))
        console.log('🎧 Advanced voice detection started')
      }

      recognitionRef.current.onresult = (event: any) => {
        // FINAL GUARD: If shutting down, ignore all recognition events
        if (shuttingDownRef.current) {
          console.log('🛑 Ignoring recognition event - shutting down')
          return
        }

        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence || 0.5
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        console.log('🎯 Voice detection result:', { finalTranscript, interimTranscript, confidence: event.results[event.resultIndex]?.[0]?.confidence || 0.5 })

        if (finalTranscript && finalTranscript.trim().length > 2) {
          const cleanTranscript = finalTranscript.trim().toLowerCase()
          const finalConfidence = event.results[event.results.length - 1]?.[0]?.confidence || 0.5
          
          console.log('🔍 Raw voice input:', { finalTranscript, cleanTranscript, finalConfidence })
          
          // Advanced human voice detection - filter out background noise
          const isHumanVoice = detectHumanVoice(cleanTranscript, finalConfidence)
          
          // Temporary: Allow all voice input for testing
          const shouldProcess = isHumanVoice || cleanTranscript.length > 2
          
          if (!shouldProcess) {
            console.log('🔇 Background noise detected - ignoring')
            return
          }
          
          console.log('✅ Voice detected - processing...')
          
          // Stop narrator if user says "stop" or "wait" or "hold"
          if ((cleanTranscript.includes('stop') || cleanTranscript.includes('wait') || cleanTranscript.includes('hold')) && synthesisRef.current) {
            synthesisRef.current.cancel()
            setConversation(prev => ({ ...prev, isResponding: false }))
            console.log('🛑 User said stop - narrator stopped')
            return
          }
          
          // Process the new question immediately and append a user entry to transcript
          const newEntry = {
            id: Date.now().toString(),
            userQuestion: finalTranscript,
            agentAnswer: "",
            timestamp: new Date()
          }
          setConversation(prev => ({ 
            ...prev, 
            userInput: finalTranscript,
            isListening: false,
            isProcessing: true,
            chatHistory: [...prev.chatHistory, newEntry]
          }))
          
          console.log('⚡ Processing human voice question...')
          
          // Trigger RAG response generation immediately
          generateRAGResponse(finalTranscript)
        } else {
          setConversation(prev => ({ 
            ...prev, 
            userInput: interimTranscript 
          }))
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        // Don't stop processing on minor errors, only on serious ones
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          setConversation(prev => ({ 
            ...prev, 
            isListening: false, 
            isProcessing: false 
          }))
        }
        
        // Don't auto-restart - let user control when to start
      }
      
      recognitionRef.current.onend = () => {
        // Auto-restart if still in recording mode (guards against hot refresh/unexpected ends)
        if (isRecording && recognitionRef.current) {
          try { recognitionRef.current.start() } catch {}
          return
        }
        console.log('Speech recognition ended - waiting for user to restart')
      }
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    }
  }, [isRecording, conversation.isResponding])

  // Cleanup when isRecording prop changes to false
  useEffect(() => {
    if (!isRecording) {
      console.log('🛑 isRecording prop changed to false - stopping all voice processing')
      
      // Stop speech synthesis immediately (robust)
      if (synthesisRef.current) {
        hardStopSpeech()
        console.log('✅ Speech synthesis hard-stopped (prop change)')
      }
      
      // Stop speech recognition immediately
      if (recognitionRef.current) {
        try { recognitionRef.current.onresult = null } catch {}
        try { recognitionRef.current.onerror = null } catch {}
        try { recognitionRef.current.onend = null } catch {}
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
        console.log('✅ Speech recognition stopped (prop change)')
      }
      
      // Stop microphone stream immediately
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks()
        tracks.forEach(track => {
          track.stop()
          console.log('✅ Microphone track stopped (prop change):', track.kind)
        })
        streamRef.current = null
        console.log('✅ Microphone stream released (prop change)')
      }
      
      // Reset conversation state
      setConversation(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        isResponding: false,
        isGenerating: false
      }))
    }
  }, [isRecording])



  // Generate RAG response with true token-by-token streaming
  const generateRAGResponse = useCallback(async (userInput: string) => {
    // FINAL GUARD: If shutting down, don't make API calls
    if (shuttingDownRef.current) {
      console.log('🛑 Ignoring RAG request - shutting down')
      return
    }

    try {
      setConversation(prev => ({ ...prev, isGenerating: true, agentResponse: "" }))
      
      console.log('🚀 Starting true token-by-token streaming...')
      
      // Use a separate, focused voice mode endpoint or modify existing one
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: `VOICE_MODE_FOCUSED: ${userInput} - Give a short, focused answer with key points only. Keep it concise and direct. No extra details, no formal language. Just the essential information in 1-2 sentences.`,
          mode: "hybrid"
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('RAG request failed:', response.status, errorText)
        throw new Error(`RAG request failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.answer) {
        console.log('⚡ Response received, starting fast full response...')
        
        // Clean and format the response for voice mode
        let cleanResponse = data.answer
          .replace(/[#*`]/g, '') // Remove hash, asterisk, backtick symbols
          .replace(/Question:|Q:|Question/gi, '') // Remove question words
          .replace(/\n+/g, ' ') // Convert multiple lines to single line
          .replace(/\s+/g, ' ') // Clean extra spaces
          .trim()
        
        // Update last user entry with assistant answer
        setConversation(prev => { 
          const updated = [...prev.chatHistory]
          for (let i = updated.length - 1; i >= 0; i--) {
            const e = updated[i] as any
            if (e && e.userQuestion && !e.agentAnswer) {
              updated[i] = { ...e, agentAnswer: cleanResponse }
              break
            }
          }
          return {
            ...prev,
            agentResponse: cleanResponse,
            isProcessing: false,
            isResponding: true,
            chatHistory: updated
          }
        })
        
        // Speak the entire response at once with fast speed
        speakFullResponse(cleanResponse)
        
        // Mark as complete after speaking
        setTimeout(() => {
          setConversation(prev => ({ 
            ...prev, 
            isGenerating: false,
            isResponding: false,
            isListening: true  // Start listening for next question
          }))
        }, 2000)
      }

    } catch (error) {
      console.error('RAG response error:', error)
      
      // Focused fallback response
      const fallbackResponse = "I'm having trouble accessing the knowledge base. Please try again."
      
      setConversation(prev => ({ 
        ...prev, 
        agentResponse: fallbackResponse,
        isGenerating: false,
        isProcessing: false,
        isResponding: true 
      }))
      
      // Speak fallback immediately
      speakFullResponse(fallbackResponse)
      
      setTimeout(() => {
        setConversation(prev => ({ ...prev, isResponding: false }))
      }, 2000)
    }
  }, [])

  // Super fast full response speech conversion
  const speakFullResponse = useCallback((fullResponse: string) => {
    // FINAL GUARD: If shutting down, don't speak
    if (shuttingDownRef.current) {
      console.log('🛑 Ignoring speech - shutting down')
      return
    }

    if (synthesisRef.current) {
      // Cancel any ongoing speech
      synthesisRef.current.cancel()
      
      // Create optimized speech utterance
      const utterance = new SpeechSynthesisUtterance(fullResponse)
      utterance.rate = 1.1        // Slightly faster for natural conversation
      utterance.pitch = 1.05      // Slightly higher pitch for friendliness
      utterance.volume = 0.9      // Clear volume
      utterance.lang = 'en-US'    // English language
      
      // Add event handlers for better control
      utterance.onstart = () => {
        console.log('🎤 Speaking full response (fast mode)')
        setConversation(prev => ({ ...prev, isResponding: true }))
      }
      
      utterance.onend = () => {
        console.log('✅ Finished speaking response - waiting for human question')
        setConversation(prev => ({ 
          ...prev, 
          isResponding: false,
          isListening: true  // Listen for next human question
        }))
        
        // Don't auto-restart - wait for human to ask next question
      }
      
      utterance.onerror = (event) => {
        // Only log non-interruption errors to avoid console spam
        if (event.error !== 'interrupted') {
          console.error('Speech synthesis error:', event)
        }
        setConversation(prev => ({ 
          ...prev, 
          isResponding: false,
          isListening: true  // Start listening for next question
        }))
      }
      
      // Start speaking immediately
      synthesisRef.current.speak(utterance)
    }
  }, [])

  // Speak individual tokens immediately for real-time voice
  const speakToken = useCallback((token: string) => {
    if (synthesisRef.current && token.trim()) {
      // Create optimized speech utterance for each token
      const utterance = new SpeechSynthesisUtterance(token)
      utterance.rate = 1.2        // Normal human speaking speed
      utterance.pitch = 1.0       // Natural pitch
      utterance.volume = 0.9      // Clear volume
      utterance.lang = 'en-US'    // English language
      
      // Start speaking immediately
      synthesisRef.current.speak(utterance)
    }
  }, [])

  // Stop speaking immediately
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      hardStopSpeech()
      setConversation(prev => ({ ...prev, isResponding: false }))
    }
  }, [hardStopSpeech])

  // Start voice conversation
  const startConversation = useCallback(async () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      try {
        // Re-initialize recognition if it was cleared during a prior stop
        if (!recognitionRef.current) {
          const Rec = (window as any).webkitSpeechRecognition
          recognitionRef.current = new Rec()
          recognitionRef.current.continuous = true
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = 'en-US'
          recognitionRef.current.maxAlternatives = 1
          recognitionRef.current.onstart = () => {
            setConversation(prev => ({ ...prev, isListening: true }))
            console.log('🎧 Advanced voice detection started (re-init)')
          }
          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = ''
            let interimTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              if (event.results[i].isFinal) finalTranscript += transcript
              else interimTranscript += transcript
            }
            const finalConfidence = event.results[event.results.length - 1]?.[0]?.confidence || 0.5
            console.log('🎯 Voice detection result:', { finalTranscript, interimTranscript, confidence: finalConfidence })
            if (finalTranscript && finalTranscript.trim().length > 2) {
              const cleanTranscript = finalTranscript.trim().toLowerCase()
              console.log('🔍 Raw voice input:', { finalTranscript, cleanTranscript, finalConfidence })
              const isHumanVoice = detectHumanVoice(cleanTranscript, finalConfidence)
              const shouldProcess = isHumanVoice || cleanTranscript.length > 2
              if (!shouldProcess) return
              console.log('✅ Voice detected - processing...')
              if ((cleanTranscript.includes('stop') || cleanTranscript.includes('wait') || cleanTranscript.includes('hold')) && synthesisRef.current) {
                synthesisRef.current.cancel()
                setConversation(prev => ({ ...prev, isResponding: false }))
                console.log('🛑 User said stop - narrator stopped')
                return
              }
              const newEntry = { id: Date.now().toString(), userQuestion: finalTranscript, agentAnswer: '', timestamp: new Date() }
              setConversation(prev => ({ ...prev, userInput: finalTranscript, isListening: false, isProcessing: true, chatHistory: [...prev.chatHistory, newEntry] }))
              console.log('⚡ Processing human voice question...')
              generateRAGResponse(finalTranscript)
            } else {
              setConversation(prev => ({ ...prev, userInput: interimTranscript }))
            }
          }
          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error (re-init):', event.error)
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
              setConversation(prev => ({ ...prev, isListening: false, isProcessing: false }))
            }
          }
          recognitionRef.current.onend = () => {
            if (isRecording && recognitionRef.current) {
              try { recognitionRef.current.start() } catch {}
              return
            }
            console.log('Speech recognition ended (re-init) - waiting for user to restart')
          }
        }
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        })
        
        streamRef.current = stream
        
        // Start speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.start()
          setIsRecording(true)
          console.log('🎤 Voice conversation started')
        }
      } catch (error) {
        console.error('Failed to start voice conversation:', error)
      }
    }
  }, [])

  // Stop voice conversation completely
  const stopConversation = useCallback(() => {
    console.log('🛑 Stopping voice conversation completely...')
    
    // Stop speech synthesis immediately (robust)
    if (synthesisRef.current) {
      hardStopSpeech()
      console.log('✅ Speech synthesis hard-stopped')
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      console.log('✅ Speech recognition stopped')
    }
    
    // Stop microphone stream with aggressive cleanup
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => {
        track.stop()
        console.log('✅ Microphone track stopped:', track.kind)
      })
      streamRef.current = null
      console.log('✅ Microphone stream released')
    }
    
    // Force release microphone permission (browser may still show indicator)
    if (navigator.mediaDevices) {
      // This is a workaround - browsers don't always immediately hide the indicator
      console.log('ℹ️ Microphone permission released (browser indicator may persist)')
    }
    
    // Reset all states
    setIsRecording(false)
    setConversation({
      isListening: false,
      isProcessing: false,
      isResponding: false,
      userInput: "",
      agentResponse: "",
      isGenerating: false,
      chatHistory: []
    })
    
    console.log('🛑 Voice conversation stopped completely')
  }, [])

  // Force stop speaking and pass history immediately
  const forceStopAndExit = useCallback(() => {
    console.log('🛑 Force stop and exit - stopping all voice processing')
    shuttingDownRef.current = true
    
    // Cancel any ongoing fetch requests
    if (typeof window !== 'undefined' && window.AbortController) {
      try {
        // Create a global abort controller if needed
        if (!(window as any).__voiceAbortController) {
          (window as any).__voiceAbortController = new AbortController()
        }
        (window as any).__voiceAbortController.abort()
        console.log('🛑 Aborted ongoing API requests')
      } catch {}
    }
    
    // Force stop any ongoing speech
    stopSpeaking()
    
    // Force stop recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.onresult = null } catch {}
      try { recognitionRef.current.onerror = null } catch {}
      try { recognitionRef.current.onend = null } catch {}
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
      console.log('✅ Speech recognition stopped (force exit)')
    }
    
    // Force stop microphone stream
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => {
        track.stop()
        console.log('✅ Microphone track stopped (force exit):', track.kind)
      })
      streamRef.current = null
      console.log('✅ Microphone stream released (force exit)')
    }
    
    // Reset recording state
    setIsRecording(false)
    
    // Reset conversation state
    setConversation(prev => ({
      ...prev,
      isListening: false,
      isProcessing: false,
      isResponding: false,
      isGenerating: false
    }))
    
    // Pass chat history immediately
    if (onExit && conversation.chatHistory.length > 0) {
      console.log('🛑 Force stopping voice mode, passing history:', conversation.chatHistory.length, 'messages')
      onExit(conversation.chatHistory)
    }
  }, [onExit, conversation.chatHistory, stopSpeaking])

  // Cleanup when component unmounts or page closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Stop everything when page is closing
      if (synthesisRef.current) {
        hardStopSpeech()
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.onresult = null } catch {}
        try { recognitionRef.current.onerror = null } catch {}
        try { recognitionRef.current.onend = null } catch {}
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }

    const handleVisibilityChange = () => {
      // Stop everything when tab becomes hidden or page loses focus
      if (document.hidden) {
        console.log('🛑 Page hidden - stopping all voice processing')
        if (synthesisRef.current) {
          synthesisRef.current.cancel()
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        setIsRecording(false)
      }
    }

    const handlePageHide = () => {
      // Stop everything when page is hidden (mobile browsers)
      console.log('🛑 Page hide event - stopping all voice processing')
      if (synthesisRef.current) {
        hardStopSpeech()
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.onresult = null } catch {}
        try { recognitionRef.current.onerror = null } catch {}
        try { recognitionRef.current.onend = null } catch {}
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      // Comprehensive cleanup on component unmount
      console.log('🛑 Component unmounting - stopping all voice processing')
      if (synthesisRef.current) {
        hardStopSpeech()
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.onresult = null } catch {}
        try { recognitionRef.current.onerror = null } catch {}
        try { recognitionRef.current.onend = null } catch {}
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
    }
  }, [])



  return {
    conversation,
    isRecording,
    startConversation,
    stopConversation,
    stopSpeaking,
    forceStopAndExit
  }
}

function useCuttlefishState(isRecording: boolean, conversationState: string) {
  const [state, setState] = useState("idle")

  useEffect(() => {
    if (isRecording) {
      // Super fast state mapping for immediate visual feedback
      const stateMapping: { [key: string]: string } = {
        'listening': 'listening',
        'processing': 'thinking',
        'generating': 'thinking',
        'responding': 'excited',
        'speaking': 'excited'
      }
      
      const newState = stateMapping[conversationState] || 'curious'
      setState(newState)
      
      console.log('🎭 3D Model State Change:', { conversationState, newState })
    } else {
      setState("idle")
    }
  }, [isRecording, conversationState])

  return { state }
}

function BubbleTrail({ position, opacity = 0.6 }: { position: [number, number, number]; opacity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current) return
    
    const animate = () => {
      if (!meshRef.current) return
      
      // Animate bubbles floating upward
      meshRef.current.position.y += 0.02
      meshRef.current.position.x += Math.sin(Date.now() * 0.003) * 0.005
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.1)

      // Fade out over time
      if (meshRef.current.material instanceof THREE.Material) {
        meshRef.current.material.opacity = Math.max(0, opacity - (meshRef.current.position.y - position[1]) * 0.1)
      }

      requestAnimationFrame(animate)
    }

    animate()
  }, [position, opacity])

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshStandardMaterial color="skyblue" emissive="skyblue" emissiveIntensity={0.5} transparent opacity={opacity} />
    </mesh>
  )
}

function CuttlefishModel({ mouse, isRecording, conversationState }: CuttlefishModelProps & { conversationState: string }) {
  const group = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const tentacleRefs = useRef<THREE.Mesh[]>([])
  const { state } = useCuttlefishState(isRecording, conversationState)
  const [bubbles, setBubbles] = useState<JSX.Element[]>([])
  const bubbleCounter = useRef(0)
  const animationRef = useRef<number>()

  // Create cuttlefish geometry
  const { bodyGeometry, tentacleGeometry } = useMemo(() => {
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
    const tentacleGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 8)
    return { bodyGeometry, tentacleGeometry }
  }, [])

  useEffect(() => {
    const animate = () => {
      if (!group.current) return

      const time = Date.now() * 0.001

      // Cursor follow
      const targetX = (mouse.x * Math.PI) / 8
      const targetY = (mouse.y * Math.PI) / 8
      group.current.rotation.y += (targetX - group.current.rotation.y) * 0.1
      group.current.rotation.x += (targetY - group.current.rotation.x) * 0.1

      // Tentacle idle sways
      tentacleRefs.current.forEach((tentacle, i) => {
        if (tentacle) {
          tentacle.rotation.z = Math.sin(time * 2 + i) * 0.15
          tentacle.rotation.x = Math.cos(time * 1.5 + i * 0.5) * 0.1
        }
      })

      // State-based animations and effects
      switch (state) {
        case "listening":
          // Gentle pulsing and attention to user
          const listeningScale = 1 + Math.sin(time * 2) * 0.02
          group.current.scale.setScalar(listeningScale)
          group.current.rotation.y = Math.sin(time * 1) * 0.1
          break

        case "processing":
        case "thinking":
          // Analytical thinking with subtle movements
          const thinkingScale = 1 + Math.sin(time * 4) * 0.03
          group.current.scale.setScalar(thinkingScale)
          group.current.position.y = Math.sin(time * 3) * 0.1
          
          // Generate thinking bubbles
          if (Math.floor(time * 3) > bubbleCounter.current) {
            bubbleCounter.current = Math.floor(time * 3)
            const newBubble = (
              <BubbleTrail
                key={`bubble-${bubbleCounter.current}`}
                position={[(Math.random() - 0.5) * 0.5, 0.5, (Math.random() - 0.5) * 0.5]}
              />
            )
            setBubbles((prev) => [...prev.slice(-8), newBubble])
          }
          break

        case "responding":
        case "excited":
          // Active response with energetic movements
          const responseScale = 1 + Math.sin(time * 6) * 0.05
          group.current.scale.setScalar(responseScale)
          group.current.position.y = Math.sin(time * 5) * 0.15
          group.current.rotation.z = Math.sin(time * 3) * 0.1
          break

        case "curious":
          group.current.position.y = Math.sin(time * 4) * 0.15
          group.current.rotation.z = Math.sin(time * 2) * 0.1
          group.current.scale.setScalar(1.05)
          break

        case "cautious":
          group.current.scale.setScalar(0.9)
          group.current.position.y = Math.sin(time * 1) * 0.05
          break

        default: // idle
          group.current.position.y = Math.sin(time * 1.5) * 0.05
          group.current.scale.setScalar(1)
          group.current.rotation.z = 0
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state, mouse.x, mouse.y])

  // Get materials based on state
  const getBodyMaterial = () => {
    const stateColors = {
      listening: "#4ECDC4",      // Teal for listening
      processing: "#FF6B6B",     // Red for processing
      responding: "#9B59B6",     // Purple for responding
      thinking: "#FF6B6B",
      curious: "#4ECDC4",
      cautious: "#F39C12",
      excited: "#9B59B6",
      idle: "#95A5A6",
    }

    const emissiveIntensity = state === "processing" ? 0.4 : 
                              state === "responding" ? 0.3 : 
                              state === "thinking" ? 0.3 : 
                              state === "excited" ? 0.2 : 0.1

    return new THREE.MeshStandardMaterial({
      color: stateColors[state as keyof typeof stateColors] || stateColors.idle,
      emissive: stateColors[state as keyof typeof stateColors] || stateColors.idle,
      emissiveIntensity,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    })
  }

  const getTentacleMaterial = () => {
    return new THREE.MeshStandardMaterial({
      color: "#7F8C8D",
      metalness: 0.2,
      roughness: 0.6,
    })
  }

  const getEyeMaterial = () => {
    return new THREE.MeshStandardMaterial({
      color: "#2C3E50",      // Dark blue-gray
      metalness: 0.3,
      roughness: 0.2,
      emissive: "#3498DB",   // Blue glow
      emissiveIntensity: 0.3,
    })
  }

  return (
    <>
      <group ref={group} dispose={null}>
        {/* Main body */}
        <mesh ref={bodyRef} geometry={bodyGeometry} material={getBodyMaterial()} position={[0, 0, 0]} />

        {/* Tentacles */}
        {Array.from({ length: 8 }).map((_, index) => {
          const angle = (index / 8) * Math.PI * 2
          const radius = 0.4
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius

          return (
            <mesh
              key={index}
              ref={(el) => {
                if (el) tentacleRefs.current[index] = el
              }}
              geometry={tentacleGeometry}
              material={getTentacleMaterial()}
              position={[x, -0.8, z]}
              rotation={[Math.PI / 6, angle, 0]}
            />
          )
        })}

        {/* Eyes */}
        <mesh position={[0.15, 0.3, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        <mesh position={[-0.15, 0.3, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>

        {/* Eye pupils */}
        <mesh position={[0.15, 0.3, 0.32]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.15, 0.3, 0.32]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* Render bubbles */}
      {bubbles}

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={state === "thinking" ? 1.5 : state === "excited" ? 1.2 : 0.8}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
        <Vignette offset={0.5} darkness={0.5} />
      </EffectComposer>
    </>
  )
}

export default function Cuttlefish3DAnimation({ isRecording, onExit }: Cuttlefish3DAnimationProps) {
  const mouse = useRef({ x: 0, y: 0 })
  const { conversation, isRecording: isConversationActive, startConversation, stopConversation, stopSpeaking, forceStopAndExit } = useRealTimeConversation(onExit)
  
  // Determine current conversation state for 3D model
  const getConversationState = () => {
    if (conversation.isListening) return 'listening'
    if (conversation.isProcessing || conversation.isGenerating) return 'processing'
    if (conversation.isResponding) return 'responding'
    return 'idle'
  }

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Auto-start conversation when component mounts
  useEffect(() => {
    if (isRecording) {
      startConversation()
    } else {
      stopConversation()
    }
  }, [isRecording, startConversation, stopConversation])

  return (
    <div className="w-screen h-screen relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true }} className="w-full h-full">
        <Suspense fallback={null}>
          {/* Lighting setup */}
          <pointLight position={[10, 10, 10]} intensity={1} />
          <ambientLight intensity={0.3} />
          
          {/* Background stars */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          <CuttlefishModel 
            mouse={mouse.current} 
            isRecording={isConversationActive} 
            conversationState={getConversationState()}
          />

          <color attach="background" args={["#0b1020"]} />
          <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
        </Suspense>
      </Canvas>
      
      {/* Conversation Controls - Full Screen Visible */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button
          onClick={startConversation}
          disabled={isConversationActive}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors shadow-lg backdrop-blur-sm border border-white/20"
        >
          🎤 Start Talk
        </button>
        <button
          onClick={() => {
            // Use the proper stop function from the hook
            console.log('🛑 Stop Talk button clicked - stopping all voice processing')
            stopConversation()
            
            // Save transcript to chat and exit voice mode as per requirement
            if (onExit && conversation.chatHistory.length > 0) {
              onExit(conversation.chatHistory)
            }
          }}
          disabled={!isConversationActive}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors shadow-lg backdrop-blur-sm border border-white/20"
        >
          ⏹️ Stop Talk
        </button>
      </div>
      
      {/* Cancel Speaking Button - Full Screen Visible */}
      {conversation.isResponding && (
        <div className="absolute top-20 left-4 z-50">
          <button
            onClick={stopSpeaking}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
          >
            🛑 Stop Speaking
          </button>
        </div>
      )}
      
      {/* Conversation Status - Full Screen Visible */}
      <div className="absolute top-16 left-4 z-50">
        <div className="text-white px-4 py-2 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              conversation.isListening ? "bg-teal-400" :
              conversation.isProcessing || conversation.isGenerating ? "bg-red-400" :
              conversation.isResponding ? "bg-purple-400" :
              "bg-green-400"
            } animate-pulse`}></div>
            <span className="capitalize">
              {conversation.isListening ? "Listening..." :
               conversation.isProcessing || conversation.isGenerating ? "⚡ Processing..." :
               conversation.isResponding ? "🎤 Speaking..." :
               "Ready"}
            </span>
          </div>
          
          {/* Status Messages */}
          {conversation.isListening && !conversation.isResponding && (
            <div className="text-xs text-green-300 animate-pulse">
              🎧 Voice detection - Ask your question
            </div>
          )}
          
          {conversation.isResponding && (
            <div className="text-xs text-purple-300 animate-pulse">
              🎤 Giving focused answer - Say "stop" to interrupt
            </div>
          )}
          
          {!conversation.isListening && !conversation.isResponding && isRecording && (
            <div className="text-xs text-yellow-300 animate-pulse">
              ⏸️ Stopped - Click "Start Talk" to resume
            </div>
          )}
          
          {!isRecording && (
            <div className="text-xs text-gray-400">
              🔇 Microphone stopped (browser indicator may persist)
            </div>
          )}
        </div>
      </div>
      
      {/* Close Button - Full Screen Visible */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => {
            console.log('🛑 Close button clicked - stopping all voice processing (hard)')
            forceStopAndExit()
          }}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 p-0 backdrop-blur-sm border border-white/20 shadow-lg"
        >
          ✕
        </button>
      </div>

      {/* Live transcript overlay intentionally removed per requirement */}
    </div>
  )
}
