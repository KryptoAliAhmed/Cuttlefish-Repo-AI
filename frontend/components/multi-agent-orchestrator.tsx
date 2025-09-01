"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Bot, 
  Brain, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Play,
  Stop,
  Settings,
  Sparkles,
  Users,
  MessageSquare,
  Zap,
  Clock,
  BarChart3,
  Network,
  Workflow
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"

interface Agent {
  id: string
  name: string
  type: string
  capabilities: string[]
  status: 'idle' | 'active' | 'completed' | 'error'
  result?: string
  executionTime?: number
}

interface OrchestrationResult {
  task: string
  final_output: string
  agent_results: {
    analysis: any
    research: any
    synthesis: any
    validation: any
  }
  execution_time: number
  agent_participation: string[]
}

export function MultiAgentOrchestrator() {
  const [isOrchestrating, setIsOrchestrating] = useState(false)
  const [task, setTask] = useState("")
  const [context, setContext] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["analyzer", "researcher", "synthesizer", "validator"])
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "analyzer",
      name: "Task Analyzer",
      type: "analysis",
      capabilities: ["task_analysis", "complexity_assessment", "planning"],
      status: 'idle'
    },
    {
      id: "researcher",
      name: "Research Agent",
      type: "research",
      capabilities: ["information_retrieval", "rag_search", "source_analysis"],
      status: 'idle'
    },
    {
      id: "synthesizer",
      name: "Synthesis Agent",
      type: "synthesis",
      capabilities: ["content_synthesis", "integration", "coherence_check"],
      status: 'idle'
    },
    {
      id: "validator",
      name: "Validation Agent",
      type: "validation",
      capabilities: ["quality_assurance", "accuracy_check", "completeness_validation"],
      status: 'idle'
    }
  ])
  const [result, setResult] = useState<OrchestrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [orchestrationProgress, setOrchestrationProgress] = useState(0)
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startOrchestration = useCallback(async () => {
    if (!task.trim()) {
      setError("Please provide a task to orchestrate")
      return
    }

    setIsOrchestrating(true)
    setOrchestrationProgress(0)
    setError(null)
    setResult(null)

    // Reset agent statuses
    setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle' as const })))

    try {
      // Simulate progress
      progressIntervalRef.current = setInterval(() => {
        setOrchestrationProgress(prev => {
          if (prev >= 90) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
            }
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Update agent statuses to active
      setAgents(prev => prev.map(agent => 
        selectedAgents.includes(agent.id) ? { ...agent, status: 'active' as const } : agent
      ))

      const response = await fetch(`${API_BASE}/api/orchestrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: task,
          context: context,
          use_agents: selectedAgents
        })
      })

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setOrchestrationProgress(100)

      if (!response.ok) {
        throw new Error(`Orchestration failed: ${response.statusText}`)
      }

      const orchestrationResult: OrchestrationResult = await response.json()
      setResult(orchestrationResult)

      // Update agent statuses to completed
      setAgents(prev => prev.map(agent => 
        selectedAgents.includes(agent.id) ? { ...agent, status: 'completed' as const } : agent
      ))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Orchestration failed')
      
      // Update agent statuses to error
      setAgents(prev => prev.map(agent => 
        selectedAgents.includes(agent.id) ? { ...agent, status: 'error' as const } : agent
      ))
    } finally {
      setIsOrchestrating(false)
      setOrchestrationProgress(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [task, context, selectedAgents])

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return <Brain className="w-4 h-4" />
      case 'research':
        return <Search className="w-4 h-4" />
      case 'synthesis':
        return <MessageSquare className="w-4 h-4" />
      case 'validation':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'idle':
        return 'text-gray-500'
      case 'active':
        return 'text-blue-500'
      case 'completed':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: Agent['status']) => {
    switch (status) {
      case 'idle':
        return <Badge variant="secondary">Idle</Badge>
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'research':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'synthesis':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'validation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Orchestration Card */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span>Multi-Agent Orchestrator</span>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              <Sparkles className="w-3 h-3 mr-1" /> GPT-5 Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Task Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task to Orchestrate
              </Label>
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Describe the task you want the agents to work on together..."
                className="min-h-[100px] resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Context (Optional)
              </Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide any additional context or constraints..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Agent Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Agents
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedAgents.includes(agent.id)
                      ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => toggleAgent(agent.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${getAgentTypeColor(agent.type)}`}>
                        {getAgentIcon(agent.type)}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {agent.name}
                      </span>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {agent.capabilities.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Orchestration Mode
                  </label>
                  <Select defaultValue="sequential">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="parallel">Parallel</SelectItem>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quality Threshold
                  </label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Fast)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Slow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {isOrchestrating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Orchestrating agents...</span>
                <span className="text-gray-600 dark:text-gray-400">{orchestrationProgress}%</span>
              </div>
              <Progress value={orchestrationProgress} className="h-2" />
              
              <div className="grid grid-cols-2 gap-3">
                {agents.filter(agent => selectedAgents.includes(agent.id)).map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 text-sm">
                    {getAgentIcon(agent.type)}
                    <span className="text-gray-700 dark:text-gray-300">{agent.name}</span>
                    <div className={`ml-auto ${getStatusColor(agent.status)}`}>
                      {agent.status === 'active' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {agent.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {agent.status === 'error' && <AlertCircle className="w-3 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{selectedAgents.length} agents selected</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTask("")
                  setContext("")
                  setResult(null)
                  setError(null)
                  setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle' as const })))
                }}
              >
                Clear
              </Button>
              <Button
                onClick={startOrchestration}
                disabled={isOrchestrating || !task.trim() || selectedAgents.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isOrchestrating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Orchestrating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Orchestration
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-200">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Orchestration Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.execution_time.toFixed(1)}s</div>
                <div className="text-sm text-green-600">Execution Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.agent_participation.length}</div>
                <div className="text-sm text-green-600">Agents Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.final_output.length}</div>
                <div className="text-sm text-green-600">Output Length</div>
              </div>
            </div>

            {/* Final Output */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Final Output
              </Label>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {result.final_output}
                </div>
              </div>
            </div>

            {/* Agent Results */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="agent-results">
                <AccordionTrigger className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Results Details
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {Object.entries(result.agent_results).map(([agentName, agentResult]) => (
                    <div key={agentName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getAgentTypeColor(agentName)}>
                          {agentName.charAt(0).toUpperCase() + agentName.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {agentResult.agent || agentName}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {agentResult.analysis || agentResult.research_findings || agentResult.synthesis || agentResult.validation_feedback || 'No detailed result available'}
                        </div>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Completed in {result.execution_time.toFixed(1)}s</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(result.final_output)}
                >
                  Copy Result
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([result.final_output], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `orchestration_result_${Date.now()}.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MultiAgentOrchestrator
