"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Brain, Zap, TrendingUp, Leaf, Users, DollarSign, Target, BarChart3, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"

interface KernelScore {
  project_id: string
  project_name: string
  scores: {
    financial: number
    ecological: number
    social: number
    overall: number
  }
  ai_analysis: Record<string, any>
  confidence: number
  timestamp: string
}

interface ProjectSubmission {
  project_id: string
  project_name: string
  metadata: {
    financial: Record<string, any>
    ecological: Record<string, any>
    social: Record<string, any>
  }
}

export function EnhancedKernelScoring() {
  const [scores, setScores] = useState<KernelScore[]>([])
  const [loading, setLoading] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [submission, setSubmission] = useState<ProjectSubmission>({
    project_id: "",
    project_name: "",
    metadata: {
      financial: { cost: 0, roi: 0, funding_source: "private", apy_projection: 0 },
      ecological: { carbon_impact: 0, renewable_percent: 0, material_sourcing: "mixed" },
      social: { job_creation: 0, community_benefit: "medium", regulatory_alignment: "compliant" }
    }
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://${API_BASE.replace('http://', '')}/ws/kernel/updates`)
        
        ws.onopen = () => {
          setWsConnected(true)
          console.log("WebSocket connected for kernel updates")
        }
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.type === "kernel_update") {
            // Update scores with real-time data
            setScores(prev => {
              const updated = [...prev]
              data.scores.forEach((newScore: any) => {
                const index = updated.findIndex(s => s.project_name === newScore.project_name)
                if (index >= 0) {
                  updated[index] = {
                    ...updated[index],
                    scores: {
                      financial: newScore.financial,
                      ecological: newScore.ecological,
                      social: newScore.social,
                      overall: calculateOverallScore(newScore)
                    },
                    timestamp: newScore.timestamp
                  }
                }
              })
              return updated
            })
          }
        }
        
        ws.onclose = () => {
          setWsConnected(false)
          console.log("WebSocket disconnected")
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000)
        }
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setWsConnected(false)
        }
        
        wsRef.current = ws
      } catch (error) {
        console.error("Failed to connect WebSocket:", error)
        setWsConnected(false)
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [API_BASE])

  const calculateOverallScore = (scores: any) => {
    const weights = { financial: 0.55, ecological: 0.30, social: 0.15 }
    return (
      scores.financial * weights.financial +
      scores.ecological * weights.ecological +
      scores.social * weights.social
    )
  }

  const handleSubmitProject = async () => {
    if (!submission.project_id || !submission.project_name) {
      toast.error("Please fill in project ID and name")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/kernel/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission)
      })

      if (response.ok) {
        const result = await response.json()
        setScores(prev => [result, ...prev])
        toast.success("Project scored successfully!")
        
        // Reset form
        setSubmission({
          project_id: "",
          project_name: "",
          metadata: {
            financial: { cost: 0, roi: 0, funding_source: "private", apy_projection: 0 },
            ecological: { carbon_impact: 0, renewable_percent: 0, material_sourcing: "mixed" },
            social: { job_creation: 0, community_benefit: "medium", regulatory_alignment: "compliant" }
          }
        })
      } else {
        const error = await response.text()
        toast.error(`Scoring failed: ${error}`)
      }
    } catch (error) {
      toast.error(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !submission.project_id || !submission.project_name) {
      toast.error("Please select a file and fill in project details")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("project_id", submission.project_id)
      formData.append("project_name", submission.project_name)

      const response = await fetch(`${API_BASE}/rag/documents/proposal`, {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Proposal uploaded and scored successfully!")
        
        // Add the scored result to our list
        if (result.meta.kernel_scores) {
          const scoredProject: KernelScore = {
            project_id: submission.project_id,
            project_name: submission.project_name,
            scores: result.meta.kernel_scores,
            ai_analysis: { method: "document_analysis" },
            confidence: 0.85,
            timestamp: result.meta.upload_time
          }
          setScores(prev => [scoredProject, ...prev])
        }
        
        // Reset form
        setSelectedFile(null)
        setSubmission({
          project_id: "",
          project_name: "",
          metadata: {
            financial: { cost: 0, roi: 0, funding_source: "private", apy_projection: 0 },
            ecological: { carbon_impact: 0, renewable_percent: 0, material_sourcing: "mixed" },
            social: { job_creation: 0, community_benefit: "medium", regulatory_alignment: "compliant" }
          }
        })
      } else {
        const error = await response.text()
        toast.error(`Upload failed: ${error}`)
      }
    } catch (error) {
      toast.error(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100 dark:bg-green-900/30"
    if (score >= 80) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
    if (score >= 70) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30"
    return "text-red-600 bg-red-100 dark:bg-red-900/30"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-transparent bg-clip-text">
            Enhanced Kernel Scoring
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          AI-driven ESG scoring with real-time updates and document ingestion
        </p>
        
        {/* Connection Status */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {wsConnected ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {wsConnected ? "Real-time updates connected" : "Real-time updates disconnected"}
          </span>
        </div>
      </div>

      {/* Project Submission Form */}
      <Card className="bg-white dark:bg-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Submit Project for AI Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_id">Project ID</Label>
              <Input
                id="project_id"
                value={submission.project_id}
                onChange={(e) => setSubmission(prev => ({ ...prev, project_id: e.target.value }))}
                placeholder="e.g., PROJ-001"
              />
            </div>
            <div>
              <Label htmlFor="project_name">Project Name</Label>
              <Input
                id="project_name"
                value={submission.project_name}
                onChange={(e) => setSubmission(prev => ({ ...prev, project_name: e.target.value }))}
                placeholder="e.g., Solar Farm Project"
              />
            </div>
          </div>

          {/* Financial Metrics */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              Financial Metrics
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cost">Project Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={submission.metadata.financial.cost}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      financial: { ...prev.metadata.financial, cost: Number(e.target.value) }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="roi">ROI (%)</Label>
                <Input
                  id="roi"
                  type="number"
                  step="0.01"
                  value={submission.metadata.financial.roi}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      financial: { ...prev.metadata.financial, roi: Number(e.target.value) }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="funding">Funding Source</Label>
                <Input
                  id="funding"
                  value={submission.metadata.financial.funding_source}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      financial: { ...prev.metadata.financial, funding_source: e.target.value }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="apy">APY Projection (%)</Label>
                <Input
                  id="apy"
                  type="number"
                  step="0.01"
                  value={submission.metadata.financial.apy_projection}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      financial: { ...prev.metadata.financial, apy_projection: Number(e.target.value) }
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Ecological Metrics */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4" />
              Ecological Metrics
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="carbon">Carbon Impact (tons/year)</Label>
                <Input
                  id="carbon"
                  type="number"
                  value={submission.metadata.ecological.carbon_impact}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      ecological: { ...prev.metadata.ecological, carbon_impact: Number(e.target.value) }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="renewable">Renewable %</Label>
                <Input
                  id="renewable"
                  type="number"
                  value={submission.metadata.ecological.renewable_percent}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      ecological: { ...prev.metadata.ecological, renewable_percent: Number(e.target.value) }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="materials">Material Sourcing</Label>
                <Input
                  id="materials"
                  value={submission.metadata.ecological.material_sourcing}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      ecological: { ...prev.metadata.ecological, material_sourcing: e.target.value }
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Social Metrics */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Social Metrics
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="jobs">Job Creation</Label>
                <Input
                  id="jobs"
                  type="number"
                  value={submission.metadata.social.job_creation}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      social: { ...prev.metadata.social, job_creation: Number(e.target.value) }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="community">Community Benefit</Label>
                <Input
                  id="community"
                  value={submission.metadata.social.community_benefit}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      social: { ...prev.metadata.social, community_benefit: e.target.value }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="regulatory">Regulatory Alignment</Label>
                <Input
                  id="regulatory"
                  value={submission.metadata.social.regulatory_alignment}
                  onChange={(e) => setSubmission(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      social: { ...prev.metadata.social, regulatory_alignment: e.target.value }
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4" />
              Upload Proposal Document (Optional)
            </Label>
            <Input
              type="file"
              accept=".pdf,.docx,.json,.md"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a proposal document for automatic ESG metric extraction and scoring
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSubmitProject}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              Score with AI
            </Button>
            
            {selectedFile && (
              <Button
                onClick={handleFileUpload}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload & Score Document
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {scores.length > 0 && (
        <Card className="bg-white dark:bg-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Scoring Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scores.map((score, index) => (
                <div key={`${score.project_id}-${index}`} className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{score.project_name}</h3>
                      <p className="text-sm text-gray-500">ID: {score.project_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(score.timestamp).toLocaleString()}
                      </p>
                      <p className={`text-sm ${getConfidenceColor(score.confidence)}`}>
                        Confidence: {(score.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Financial</span>
                      </div>
                      <Badge className={`${getScoreColor(score.scores.financial)}`}>
                        {score.scores.financial}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Leaf className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Ecological</span>
                      </div>
                      <Badge className={`${getScoreColor(score.scores.ecological)}`}>
                        {score.scores.ecological}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-pink-500" />
                        <span className="text-sm font-medium">Social</span>
                      </div>
                      <Badge className={`${getScoreColor(score.scores.social)}`}>
                        {score.scores.social}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">Overall</span>
                      </div>
                      <Badge className={`${getScoreColor(score.scores.overall)}`}>
                        {score.scores.overall}
                      </Badge>
                    </div>
                  </div>
                  
                  {score.ai_analysis && Object.keys(score.ai_analysis).length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">AI Analysis</h4>
                      <pre className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                        {JSON.stringify(score.ai_analysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
