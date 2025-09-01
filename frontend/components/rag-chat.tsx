"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Plus, Loader2, Brain, Mic, Search, AudioLines, Send, Trash2, MoreVertical, Pencil, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ReactMarkdown from "react-markdown"
import { createPortal } from "react-dom"
import { chatPersistence, ChatMessage, ChatSession } from "@/lib/chat-persistence"
import { ContextWindow } from "@/components/context-window"
import { AuditLog } from "@/components/audit-log"
import type { AuditLogEntry } from "@/lib/types"
import { MockBuilderAgentFactoryCWA } from "@/lib/agent-factory-mock"
import { getPerformanceTier } from "@/lib/esg-scorer"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"
const SIDEBAR_KEY = "cuttlefish_rag_sidebar_pct"

export function RAGChat({ onOpenVoiceMode, onKernelScores }: { onOpenVoiceMode?: () => void; onKernelScores?: (k: { financial: number; ecological: number; social: number }) => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Voice STT
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  // Resizable sidebar
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [sidebarPct, setSidebarPct] = useState(24)
  const [isResizing, setIsResizing] = useState(false)
  // Voice TTS
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  // Context & Audit
  const [contextText, setContextText] = useState("")
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const agentFactoryRef = useRef<MockBuilderAgentFactoryCWA | null>(null)
  // Scroll-to-bottom
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  // Sidebar search
  const [searchQuery, setSearchQuery] = useState("")
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  // ESG scoring state
  const [financialKernel, setFinancialKernel] = useState<number | null>(null)
  const [ecologicalKernel, setEcologicalKernel] = useState<number | null>(null)
  const [socialKernel, setSocialKernel] = useState<number | null>(null)
  const [overallESG, setOverallESG] = useState<number | null>(null)

  const userName = "Rana Hamza"

  // Load sessions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    }
    agentFactoryRef.current = new MockBuilderAgentFactoryCWA()

    // Restore sidebar width
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved) {
        const val = parseFloat(saved)
        if (!Number.isNaN(val) && val >= 16 && val <= 40) setSidebarPct(val)
      }
    } catch {}

    const all = chatPersistence.getAllSessions()
    if (all.length === 0) {
      const id = chatPersistence.createSession()
      const created = chatPersistence.getAllSessions()
      setSessions(created)
      const current = created.find((s) => s.id === id) || null
      setCurrentSession(current)
      setMessages(chatPersistence.getMessages())
    } else {
      setSessions(all)
      const current = chatPersistence.getCurrentSession()
      setCurrentSession(current)
      setMessages(chatPersistence.getMessages())
    }
  }, [])

  // Simple status check
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`)
        if (!cancelled) setIsConnected(res.ok)
      } catch {
        if (!cancelled) setIsConnected(false)
      }
    }
    check()
    const t = setInterval(check, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const createNewChat = () => {
    const id = chatPersistence.createSession()
    const updated = chatPersistence.getAllSessions()
    setSessions(updated)
    const current = updated.find((s) => s.id === id) || null
    setCurrentSession(current)
    setMessages(chatPersistence.getMessages())
  }

  const selectSession = (sessionId: string) => {
    if (chatPersistence.setCurrentSession(sessionId)) {
      const current = chatPersistence.getCurrentSession()
      setCurrentSession(current)
      setMessages(chatPersistence.getMessages())
    }
  }

  const deleteSession = (sessionId: string) => {
    const ok = chatPersistence.deleteSession(sessionId)
    if (ok) {
      const updated = chatPersistence.getAllSessions()
      setSessions(updated)
      const current = chatPersistence.getCurrentSession()
      setCurrentSession(current)
      setMessages(chatPersistence.getMessages())
      if (updated.length === 0) {
        createNewChat()
      }
    }
  }

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToEnd()
  }, [messages, isSending])

  // Track transcript scroll position for FAB
  useEffect(() => {
    const el = chatScrollRef.current
    if (!el) return
    const onScroll = () => {
      const threshold = 120
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
      setShowScrollDown(!nearBottom)
    }
    el.addEventListener('scroll', onScroll)
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [chatScrollRef.current])

  // Handle resize drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      const clamped = Math.max(16, Math.min(40, pct))
      setSidebarPct(clamped)
      try { localStorage.setItem(SIDEBAR_KEY, String(clamped)) } catch {}
    }
    const onUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isResizing])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isSending) return

    setIsSending(true)
    setInput("")
    chatPersistence.addMessage({ role: "user", content: question })
    setMessages(chatPersistence.getMessages())

    try {
      // Build context window and audit logs (parity with previous control panel)
      agentFactoryRef.current?.buildContextWindow(question, (newContext, newLog) => {
        setContextText(newContext)
        if (newLog) setAuditLogs((prev) => [...prev, newLog])
      })

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      })

      if (res.ok) {
        const data = await res.json()
        const content = data?.answer || ""
        const decorated = content
        chatPersistence.addMessage({ role: "assistant", content: decorated, source: data?.source, confidence: data?.confidence })
        // Update ESG scores from backend computation (defaults to 0 initially)
        try {
          const esg = data?.esg
          if (esg?.kernel_scores) {
            const fin = Number(esg.kernel_scores.financial) || 0
            const eco = Number(esg.kernel_scores.ecological) || 0
            const soc = Number(esg.kernel_scores.social) || 0
            setFinancialKernel(fin)
            setEcologicalKernel(eco)
            setSocialKernel(soc)
            onKernelScores?.({ financial: fin, ecological: eco, social: soc })
            // Use the overall score from the superior kernel engine instead of hardcoded calculation
            const overall = Number(esg?.overall?.score)
            setOverallESG(Number.isFinite(overall) ? overall : 0)
          } else {
            setFinancialKernel(0)
            setEcologicalKernel(0)
            setSocialKernel(0)
            setOverallESG(0)
            onKernelScores?.({ financial: 0, ecological: 0, social: 0 })
          }
        } catch {}
        // Voice speak back
        if (voiceReplyEnabled && synthesisRef.current) {
          try {
            synthesisRef.current.cancel()
            const utter = new SpeechSynthesisUtterance(decorated.replace(/[\n`#*]+/g, ' ').trim())
            utter.rate = 1.05
            utter.pitch = 1.03
            utter.volume = 0.9
            utter.lang = 'en-US'
            setIsSpeaking(true)
            utter.onend = () => setIsSpeaking(false)
            utter.onerror = (event) => {
              // Only log non-interruption errors to avoid console spam
              if (event.error !== 'interrupted') {
                console.error('Speech synthesis error:', event)
              }
              setIsSpeaking(false)
            }
            currentUtteranceRef.current = utter
            synthesisRef.current.speak(utter)
          } catch {}
        }
      } else {
        chatPersistence.addMessage({ role: "assistant", content: `Error: ${res.status} ${res.statusText}` })
      }
    } catch (e: any) {
      chatPersistence.addMessage({ role: "assistant", content: `Network error: ${e?.message || e}` })
    } finally {
      setMessages(chatPersistence.getMessages())
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Voice capture and transcription to backend
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      })
      streamRef.current = stream
      chunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstart = () => { setIsRecording(true); setShowVoiceOverlay(true) }
      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true)
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
          const form = new FormData()
          form.append('file', blob, 'recording.webm')
          const resp = await fetch(`${API_BASE}/api/transcribe`, { method: 'POST', body: form })
          if (!resp.ok) { setIsProcessing(false); return }
          const data = await resp.json()
          const text = data?.text || ''
          if (text) setInput(prev => (prev ? prev + "\n" + text : text))
        } catch {
        } finally {
          setIsProcessing(false)
          setIsRecording(false)
          setShowVoiceOverlay(false)
          mediaRecorderRef.current = null
        }
      }
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
    } catch {
      setIsRecording(false)
      setIsProcessing(false)
      mediaRecorderRef.current = null
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop()
    setShowVoiceOverlay(false)
  }

  const stopAllVoice = () => {
    try { if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop() } catch {}
    try { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null } } catch {}
    setIsRecording(false)
    setIsProcessing(false)
    setShowVoiceOverlay(false)
    // Forcefully stop any speech synthesis (handles browsers that ignore a single cancel)
    const synth = synthesisRef.current
    try {
      if (synth) {
        // Detach listeners from any in-flight utterance
        if (currentUtteranceRef.current) {
          currentUtteranceRef.current.onend = null
          currentUtteranceRef.current.onerror = null
          currentUtteranceRef.current = null
        }
        let tries = 0
        const hardStop = () => {
          try { synth.pause() } catch {}
          try { synth.cancel() } catch {}
          try { synth.resume() } catch {}
          try { synth.cancel() } catch {}
          tries += 1
          if (synth.speaking && tries < 10) {
            setTimeout(hardStop, 50)
          } else {
            setIsSpeaking(false)
          }
        }
        hardStop()
      } else {
        setIsSpeaking(false)
      }
    } catch {
      setIsSpeaking(false)
    }
  }

  // Cleanup on unmount to ensure no lingering speech
  useEffect(() => {
    return () => {
      try { synthesisRef.current?.cancel() } catch {}
    }
  }, [])

  const preview = useMemo(() => (msg: ChatMessage) => {
    const text = msg.content || ""
    return text.length > 80 ? `${text.slice(0, 80)}…` : text
  }, [])

  const formatTime = (d: Date) => {
    try {
      return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  const formatRelative = (d: Date) => {
    try {
      const now = Date.now()
      const t = new Date(d).getTime()
      const diff = Math.max(0, Math.floor((now - t) / 1000))
      if (diff < 60) return `${diff}s ago`
      const m = Math.floor(diff / 60)
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      const days = Math.floor(h / 24)
      return `${days}d ago`
    } catch { return "" }
  }

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }

  // Helper: date key for separators
  const dateKey = (d: Date) => {
    try {
      const dt = new Date(d)
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
    } catch { return "" }
  }

  // Ranked search results for sidebar search
  const rankedResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || q.length < 2) return [] as { session: ChatSession; score: number; snippet: string }[]

    const tokens = q.split(/\s+/).filter(Boolean)

    const scoreSession = (s: ChatSession): { score: number; snippet: string } => {
      let score = 0
      const name = (s.name || '').toLowerCase()
      if (name.includes(q)) score += 5
      for (const t of tokens) {
        if (name.includes(t)) score += 1
      }
      // Search last N messages for speed
      const recent = (s.messages || []).slice(-20).map(m => (m.content || '').toLowerCase()).join(" \n ")
      if (recent.includes(q)) score += 4
      for (const t of tokens) {
        if (recent.includes(t)) score += 1
      }
      // Build a small snippet from the last message
      const last = (s.messages || [])[s.messages.length - 1]
      const snippet = last ? (last.content.length > 90 ? `${last.content.slice(0, 90)}…` : last.content) : "Empty"
      return { score, snippet }
    }

    return sessions
      .map((s) => ({ session: s, ...scoreSession(s) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [searchQuery, sessions])

  const selectTopSearch = () => {
    const top = rankedResults[0]
    if (top) {
      selectSession(top.session.id)
      setSearchQuery("")
    }
  }

  // Export and clear actions (kept for potential future but not rendered)
  const exportCurrent = () => {
    if (!currentSession) return
    const data = chatPersistence.exportSession(currentSession.id)
    if (!data) return
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession.name.replace(/\s+/g,'_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearCurrent = () => {
    chatPersistence.clearCurrentSession()
    setMessages(chatPersistence.getMessages())
  }

  return (
    <>
      <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl w-full mb-10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span>Cuttlefish</span>
              {currentSession && (
                <span className="text-sm text-gray-500 dark:text-gray-400">— {currentSession.name}</span>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant={isConnected ? "default" : "secondary"} className={`${isConnected ? "bg-green-500" : "bg-red-500"} text-white`}>
                <Brain className="w-3 h-3 mr-1" /> {isConnected === null ? "Checking" : isConnected ? "RAG Connected" : "RAG Offline"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={containerRef} className="w-full min-h-[68vh] md:h-[78vh]">
            <div className="h-full w-full flex">
              {/* Left: Sidebar */}
              <div
                className="h-full"
                style={{ width: `${sidebarPct}%`, minWidth: 260, maxWidth: 420 }}
              >
                <div className="h-full flex flex-col bg-white/70 dark:bg-slate-900/40 border-r border-slate-200/70 dark:border-slate-700/70">
                  <div className="p-3 space-y-2">
                    <button onClick={createNewChat} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left" title="New chat">
                      <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">New chat</span>
                    </button>
                    <div className="relative">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); selectTopSearch() } }}
                          placeholder="Search chats"
                          className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        />
                      </div>
                      {searchQuery.trim().length > 1 && rankedResults.length > 0 && (
                        <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800 shadow-lg max-h-72 overflow-y-auto">
                          {rankedResults.map((r) => (
                            <button
                              key={r.session.id}
                              onClick={() => { selectSession(r.session.id); setSearchQuery("") }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                            >
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.session.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.snippet}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Removed Library, Sora and GPTs per request */}
                  </div>
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">CHATS</div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {sessions.length === 0 && (
                        <div className="text-xs text-slate-500 px-2 py-3">No chats yet</div>
                      )}
                      {sessions.map((s) => {
                        const isActive = currentSession && currentSession.id === s.id
                        const last = (s.messages && s.messages[s.messages.length - 1]?.content) || "Empty"
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                chatPersistence.setCurrentSession(s.id)
                                setCurrentSession(s)
                                setMessages((s as any).messages || [])
                              }}
                              className={`flex-1 text-left px-3 py-2 rounded-xl border ${isActive ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-white/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/70'} hover:bg-slate-50 dark:hover:bg-slate-800`}
                              title={s.name}
                            >
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{s.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{last}</div>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                  aria-label="Chat actions"
                                  title="Chat actions"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRenamingSessionId(s.id); setRenameValue(s.name) }}>
                                  <Pencil className="w-4 h-4" />
                                  <span>Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteSession(s.id) }} className="text-red-600 focus:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <div role="separator" aria-orientation="vertical" onMouseDown={() => setIsResizing(true)} className={`w-1.5 cursor-col-resize bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300/70 ${isResizing ? "opacity-80" : "opacity-100"}`} />
              {/* Right: chat area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Toolbar intentionally minimal per design: no Export/Clear */}

                <div ref={chatScrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/60 relative">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">Where should we begin?</h2>
                      <div className="w-full max-w-3xl">
                        <div className="flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 px-4 py-3 shadow-lg">
                          <Plus className="w-5 h-5 text-gray-500" />
                          <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            placeholder="Ask anything"
                            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                          />
                          <button
                            onClick={() => (isRecording ? stopRecording() : startRecording())}
                            title={isRecording ? "Stop recording" : isProcessing ? "Processing audio…" : "Speak to text"}
                            className={`relative w-11 h-11 aspect-square rounded-full shadow-xl transition-all duration-300 overflow-hidden flex items-center justify-center
                              ${isProcessing ? 'animate-pulse ring-2 ring-yellow-400/60' : ''}
                              ${isRecording 
                                ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-2 ring-red-400/60 scale-105' 
                                : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:scale-105'}`}
                          >
                            <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                            <Mic className="w-4 h-4 relative z-10" />
                            {isRecording && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />}
                          </button>
                          {(isRecording || isProcessing || isSpeaking) && (
                            <button
                              onClick={stopAllVoice}
                              title="Stop voice"
                              className="relative w-11 h-11 aspect-square rounded-full shadow-xl transition-all duration-300 overflow-hidden flex items-center justify-center bg-gradient-to-br from-rose-500 to-red-600 text-white hover:scale-105"
                              aria-label="Stop voice"
                            >
                              <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                              <X className="w-4 h-4 relative z-10" />
                            </button>
                          )}
                          {onOpenVoiceMode && (
                            <button
                              onClick={() => onOpenVoiceMode()}
                              title="Voice Mode"
                              className="relative w-11 h-11 aspect-square rounded-full text-white shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 hover:scale-105 flex items-center justify-center"
                            >
                              <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                              <AudioLines className="w-4 h-4 relative z-10" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overallESG !== null && (
                        <div className="flex flex-wrap gap-3 items-center mb-2">
                          <Badge variant="secondary">Financial: {financialKernel ?? "-"}</Badge>
                          <Badge variant="secondary">Ecological: {ecologicalKernel ?? "-"}</Badge>
                          <Badge variant="secondary">Social: {socialKernel ?? "-"}</Badge>
                          <Badge className="bg-blue-600 text-white">Overall ESG: {overallESG} ({getPerformanceTier(overallESG)})</Badge>
                        </div>
                      )}
                      {messages.map((m, idx) => {
                        const prev = messages[idx - 1]
                        const needDay = !prev || dateKey(prev.timestamp) !== dateKey(m.timestamp)
                        const isGrouped = prev && prev.role === m.role && Math.abs(new Date(m.timestamp).getTime() - new Date(prev.timestamp).getTime()) < 2 * 60 * 1000
                        return (
                          <div key={m.id}>
                            {needDay && (
                              <div className="my-2 text-center">
                                <span className="inline-block text-xs px-2 py-1 rounded-full bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{new Date(m.timestamp).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm ${m.role === "user" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-slate-200/60 dark:border-slate-700/60"}`}>
                                {!isGrouped && (
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs opacity-80">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>{m.role === "user" ? <span>👤</span> : <span>🤖</span>}</div>
                                      <span>{m.role === "user" ? "You" : "Assistant"}</span>
                                    </div>
                                    <div className="text-[11px] opacity-60">{formatTime(m.timestamp)}</div>
                                  </div>
                                )}
                                {m.role === "assistant" ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</div>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-3 text=[11px] opacity-70">
                                  {m.source && <span>Source: {m.source}</span>}
                                  {typeof m.confidence === "number" && <span>Confidence: {(m.confidence * 100).toFixed(1)}%</span>}
                                  {m.role === "assistant" && (
                                    <button onClick={() => copyMessage(m.id, m.content)} className={`ml-auto px-2 py-1 rounded-md border ${copiedId === m.id ? "border-green-400 text-green-600" : "border-slate-300 text-slate-600 dark:text-slate-300"}`} title="Copy message">{copiedId === m.id ? "Copied" : "Copy"}</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {isSending && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Assistant is thinking…</span>
                          </div>
                        </div>
                      )}
                      <div ref={endRef} />
                    </div>
                  )}
                </div>
                <div role="separator" className="h-px w-full bg-black/10 dark:bg-white/10" />
                {/* Bottom input appears only after first message */}
                {messages.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 px-3 py-2 shadow-md">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isConnected ? "Send a message (Shift+Enter for newline)" : "RAG offline – you can still draft a message"}
                        rows={2}
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus:outline-none"
                      />
                      <button
                        onClick={() => (isRecording ? stopRecording() : startRecording())}
                        disabled={isProcessing}
                        className={`relative h-11 w-11 aspect-square rounded-full shadow-xl transition-all duration-300 overflow-hidden flex items-center justify-center
                          ${isProcessing ? 'bg-yellow-500 text-white animate-pulse ring-2 ring-yellow-300/60' : ''}
                          ${isRecording ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white animate-pulse ring-2 ring-red-400/60 scale-105' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:scale-105'}`}
                        title={isProcessing ? "Processing audio..." : isRecording ? "Click to stop recording" : "Click to start voice input"}
                      >
                        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                        <Mic className="w-4 h-4 relative z-10" />
                        {isRecording && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />}
                      </button>
                      {(isRecording || isProcessing || isSpeaking) && (
                        <button
                          onClick={stopAllVoice}
                          className="relative h-11 w-11 aspect-square rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                          title="Stop voice"
                          aria-label="Stop voice"
                        >
                          <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                          <X className="w-4 h-4 relative z-10" />
                        </button>
                      )}
                      {onOpenVoiceMode && (
                        <button
                          onClick={() => onOpenVoiceMode()}
                          className="relative h-11 w-11 aspect-square rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                          title="Open real-time Voice Mode"
                          aria-label="Open real-time Voice Mode"
                        >
                          <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                          <AudioLines className="w-4 h-4 relative z-10" />
                        </button>
                      )}
                      {/* Send button removed per requirement; press Enter to send */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen overlay during voice capture/transcription */}
      {showVoiceOverlay && createPortal(
        <div className="fixed inset-0 z-[2147483647]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-[10001] w-screen h-screen p-4 sm:p-6 flex items-center justify-center">
            <div className="relative w-full max-w-3xl rounded-2xl border border-purple-500/30 bg-black/60 backdrop-blur-md shadow-2xl p-6">
              <button
                onClick={stopAllVoice}
                className="absolute top-3 right-3 w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white"
                aria-label="Close"
                title="Close"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl 
                  ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}> 
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="text-2xl font-semibold text-white">
                  {isProcessing ? 'Processing your audio…' : isRecording ? 'Listening…' : 'Voice mode'}
                </div>
                <div className="text-sm text-purple-200/80 max-w-xl">
                  Speak naturally. We’ll transcribe and insert your words into the chat input automatically.
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white shadow hover:shadow-lg"
                  >
                    Stop recording
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Bottom: Context Window and Audit Log */}
      <div className="relative z-0 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ContextWindow context={contextText} />
        <AuditLog logs={auditLogs} />
      </div>
      {renamingSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRenamingSessionId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Rename chat</div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const ok = chatPersistence.renameSession(renamingSessionId, renameValue)
                  if (ok) {
                    setSessions(chatPersistence.getAllSessions())
                    setCurrentSession(chatPersistence.getCurrentSession())
                  }
                  setRenamingSessionId(null)
                } else if (e.key === 'Escape') {
                  setRenamingSessionId(null)
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={() => setRenamingSessionId(null)} className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700">Cancel</button>
              <button
                onClick={() => {
                  const ok = chatPersistence.renameSession(renamingSessionId, renameValue)
                  if (ok) {
                    setSessions(chatPersistence.getAllSessions())
                    setCurrentSession(chatPersistence.getCurrentSession())
                  }
                  setRenamingSessionId(null)
                }}
                className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default RAGChat


