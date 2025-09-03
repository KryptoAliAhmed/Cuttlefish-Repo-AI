"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Checkbox
} from "@/components/ui/checkbox"
import { 
  Activity,
  Bot,
  Workflow,
  Shield,
  Eye,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Hash,
  Network,
  BarChart3,
  Settings,
  Zap,
  Users,
  TrendingUp,
  Lock,
  Unlock,
  RefreshCw,
  Filter,
  Search,
  Download,
  Share2,
  Copy,
  ExternalLink,
  X
} from "lucide-react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"

interface Agent {
  agent_id: string
  agent_type: string
  status: string
}

interface TrustGraphEntry {
  entry_id: string
  agent_action: {
    agent_id: string
    agent_type: string
    action: string
    tool: string
    timestamp: number
    score?: number
    comment?: string
  }
  current_hash: string
  previous_hash?: string
  timestamp: string
}

interface WorkflowStatus {
  task_id: string
  title: string
  status: string
  workflow_type: string
  agents: string[]
  created_at: number
  result?: any
  audit_log: string[]
}

interface SwarmWorkflow {
  title: string
  description: string
  workflow_type: "sequential" | "parallel" | "hybrid"
  agents: string[]
  context: Record<string, any>
}

export function SwarmProtocolDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [trustGraphEntries, setTrustGraphEntries] = useState<TrustGraphEntry[]>([])
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowStatus[]>([])
  const [selectedAgentType, setSelectedAgentType] = useState<string>("all")
  const [limit, setLimit] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Workflow creation state
  const [newWorkflow, setNewWorkflow] = useState<SwarmWorkflow>({
    title: "",
    description: "",
    workflow_type: "sequential",
    agents: [],
    context: {}
  })
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false)
  
  // Real-time updates
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [autoRefresh, setAutoRefresh] = useState(true)

  const availableAgents = [
    "BuilderAgent",
    "SignalAgent", 
    "PermitAgent",
    "RefactorAgent",
    "PredictiveAgent",
    "ComplianceAgent",
    "MetaAuditor"
  ]

  const workflowTypes = [
    { value: "sequential", label: "Sequential", description: "Agents execute one after another" },
    { value: "parallel", label: "Parallel", description: "Agents execute simultaneously" },
    { value: "hybrid", label: "Hybrid", description: "Combination of sequential and parallel" }
  ]

  // Load agents
  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/swarm/agents`)
      if (!response.ok) throw new Error('Failed to load agents')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    }
  }, [])

  // Load TrustGraph entries
  const loadTrustGraph = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
              if (selectedAgentType && selectedAgentType !== "all") params.append('agent_type', selectedAgentType)
      params.append('limit', limit.toString())
      
      const response = await fetch(`${API_BASE}/swarm/trustgraph?${params}`)
      if (!response.ok) throw new Error('Failed to load TrustGraph')
      const data = await response.json()
      setTrustGraphEntries(data.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load TrustGraph')
    } finally {
      setIsLoading(false)
    }
  }, [selectedAgentType, limit])

  // Create and execute workflow
  const createWorkflow = async () => {
    try {
      setIsCreatingWorkflow(true)
      setError(null)
      
      const response = await fetch(`${API_BASE}/swarm/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow)
      })
      
      if (!response.ok) throw new Error('Failed to create workflow')
      const result = await response.json()
      
      // Add to active workflows
      setActiveWorkflows(prev => [result, ...prev])
      
      // Reset form
      setNewWorkflow({
        title: "",
        description: "",
        workflow_type: "sequential",
        agents: [],
        context: {}
      })
      
      // Refresh TrustGraph
      await loadTrustGraph()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    } finally {
      setIsCreatingWorkflow(false)
    }
  }

  // Load workflow status
  const loadWorkflowStatus = async (taskId: string) => {
    try {
      const response = await fetch(`${API_BASE}/swarm/workflow/${taskId}`)
      if (!response.ok) throw new Error('Failed to load workflow status')
      const status = await response.json()
      
      setActiveWorkflows(prev => 
        prev.map(w => w.task_id === taskId ? status : w)
      )
    } catch (err) {
      console.error('Failed to load workflow status:', err)
    }
  }

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      loadTrustGraph()
      setLastUpdate(new Date())
    }, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(interval)
  }, [autoRefresh, loadTrustGraph])

  // Initial load
  useEffect(() => {
    loadAgents()
    loadTrustGraph()
  }, [loadAgents, loadTrustGraph])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'audited':
        return <Shield className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      audited: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const exportTrustGraph = () => {
    const data = JSON.stringify(trustGraphEntries, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trustgraph_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Swarm Protocol Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor multi-agent orchestration and TrustGraph transparency
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={(checked) => setAutoRefresh(checked as boolean)}
            />
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              loadTrustGraph()
              setLastUpdate(new Date())
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={exportTrustGraph}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Agents</p>
                                        <p className="text-2xl font-bold">{(agents?.length || 0)}</p>
              </div>
              <Bot className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">TrustGraph Entries</p>
                                        <p className="text-2xl font-bold">{(trustGraphEntries?.length || 0)}</p>
              </div>
              <Hash className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Workflows</p>
                                        <p className="text-2xl font-bold">
                          {(activeWorkflows?.filter(w => w.status === 'running')?.length || 0)}
                        </p>
              </div>
              <Workflow className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Update</p>
                <p className="text-sm font-medium">
                  {mounted ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="trustgraph">TrustGraph</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Create New Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow-title">Title</Label>
                  <Input
                    id="workflow-title"
                    value={newWorkflow.title}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Solar Farm Optimization"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workflow-type">Workflow Type</Label>
                  <Select
                    value={newWorkflow.workflow_type}
                    onValueChange={(value: "sequential" | "parallel" | "hybrid") => 
                      setNewWorkflow(prev => ({ ...prev, workflow_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the workflow objective..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Agents</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableAgents.map(agent => (
                    <div key={agent} className="flex items-center space-x-2">
                      <Checkbox
                        id={`agent-${agent}`}
                        checked={newWorkflow.agents.includes(agent)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewWorkflow(prev => ({ 
                              ...prev, 
                              agents: [...prev.agents, agent] 
                            }))
                          } else {
                            setNewWorkflow(prev => ({ 
                              ...prev, 
                              agents: prev.agents.filter(a => a !== agent) 
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`agent-${agent}`} className="text-sm">
                        {agent}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={createWorkflow}
                disabled={isCreatingWorkflow || !newWorkflow.title || (newWorkflow.agents?.length || 0) === 0}
                className="w-full"
              >
                {isCreatingWorkflow ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Workflow...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Create & Execute Workflow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Active Workflows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(activeWorkflows?.length || 0) === 0 ? (
                <p className="text-gray-500 text-center py-8">No active workflows</p>
              ) : (
                <div className="space-y-4">
                  {activeWorkflows?.map((workflow) => (
                    <div
                      key={workflow.task_id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(workflow.status)}
                          <div>
                            <h3 className="font-medium">{workflow.title}</h3>
                            <p className="text-sm text-gray-500">
                              {workflow.workflow_type || 'Unknown'} • {(workflow.agents?.length || 0)} agents
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(workflow.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadWorkflowStatus(workflow.task_id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {workflow.result && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="result">
                            <AccordionTrigger>View Results</AccordionTrigger>
                            <AccordionContent>
                              <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-auto">
                                {JSON.stringify(workflow.result, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      
                      {(workflow.audit_log?.length || 0) > 0 && (
                        <div className="text-sm text-gray-600">
                          <strong>Audit Log:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {workflow.audit_log?.map((log, index) => (
                              <li key={index}>{log}</li>
                            )) || []}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TrustGraph Tab */}
        <TabsContent value="trustgraph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                TrustGraph Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="agent-filter">Agent Type:</Label>
                  <Select
                    value={selectedAgentType}
                    onValueChange={setSelectedAgentType}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                                          <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        {availableAgents.map(agent => (
                          <SelectItem key={agent} value={agent}>
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="limit">Limit:</Label>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => setLimit(parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* TrustGraph Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : (trustGraphEntries?.length || 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No TrustGraph entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      trustGraphEntries?.map((entry) => (
                        <TableRow key={entry.entry_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4" />
                              <span className="font-medium">
                                {entry?.agent_action?.agent_type ?? 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{entry?.agent_action?.action ?? '-'}</TableCell>
                          <TableCell>{entry?.agent_action?.tool ?? '-'}</TableCell>
                          <TableCell>
                            {typeof entry?.agent_action?.score === 'number' ? (
                              <Badge variant="secondary">
                                {entry.agent_action.score.toFixed(2)}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                {entry?.current_hash ? `${entry.current_hash.slice(0, 8)}...` : '-'}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => entry?.current_hash && copyToClipboard(entry.current_hash)}
                                disabled={!entry?.current_hash}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry?.timestamp ? new Date(entry.timestamp).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(entry, null, 2))}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/swarm/entry/${entry.entry_id}`, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Registered Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents?.map((agent) => (
                  <div
                    key={agent.agent_id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{agent.agent_type}</h3>
                          <p className="text-sm text-gray-500">{agent.agent_id}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {agent.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p><strong>Type:</strong> {agent.agent_type}</p>
                      <p><strong>Status:</strong> {agent.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {(agents?.length || 0) === 0 && (
                <p className="text-gray-500 text-center py-8">No agents registered</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SwarmProtocolDashboard
