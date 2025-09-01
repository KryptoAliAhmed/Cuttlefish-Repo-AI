"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Loader2, Send, FileText, Brain, AlertCircle, Zap, BookOpen, Mic } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  source?: string
  confidence?: number
  timestamp: Date
}

interface RAGStatus {
  documents_loaded: number
  index_ready: boolean
  pdf_files: string[]
}

export function RAGAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("checking")

  useEffect(() => {
    checkRAGStatus()
  }, [])

  const checkRAGStatus = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
      const response = await fetch(`${API}/api/status`)
      if (response.ok) {
        const status = await response.json()
        setRagStatus(status)
        setIsConnected(true)
        setConnectionStatus("connected")
      } else {
        setIsConnected(false)
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("Failed to connect to RAG service:", error)
      setIsConnected(false)
      setConnectionStatus("disconnected")
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: input })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.answer,
          source: data.source,
          confidence: data.confidence,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `Error: ${errorData.error || "Failed to get response"}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Error: Failed to connect to RAG service. Please make sure the Flask server is running on port 5000.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          RAG Document Agent
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          An intelligent agent for querying and analyzing your PDF documents
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="w-full justify-center"
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              Documents Loaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ragStatus?.documents_loaded || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4" />
              Index Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={ragStatus?.index_ready ? "default" : "secondary"}
              className="w-full justify-center"
            >
              {ragStatus?.index_ready ? "Ready" : "Not Ready"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Document Chat
            {!isConnected && (
              <Badge variant="destructive" className="ml-auto">
                Service Offline
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with your documents</p>
                  <p className="text-sm">Add PDF files to the ./test directory to enable RAG</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.source && (
                      <div className="text-xs mt-2 opacity-70">
                        Source: {message.source}
                      </div>
                    )}
                    {message.confidence && (
                      <div className="text-xs mt-1 opacity-70">
                        Confidence: {(message.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing documents...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              className="flex-1"
              rows={2}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-auto px-3"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !isConnected}
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  RAG service not connected. Start the Flask server with: python RAG.py
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Files List */}
      {ragStatus?.pdf_files && ragStatus.pdf_files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Loaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ragStatus.pdf_files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {file}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 