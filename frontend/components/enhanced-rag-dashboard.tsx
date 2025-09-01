import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, BarChart3, Activity, Zap, Target } from "lucide-react"

interface PredictionAggregationResult {
  consensus_prediction: {
    financial_score: number
    ecological_score: number
    social_score: number
    overall_score: number
  }
  confidence: number
  bias_reduction: number
  model_contributions: Record<string, number>
  disagreement_score: number
  ensemble_metrics: Record<string, number>
}

interface RerankResult {
  document: string
  relevance_score: number
  original_index: number
  rerank_rank: number
  metadata: Record<string, any>
}

interface RerankResponse {
  results: RerankResult[]
  performance_metrics: Record<string, any>
}

export default function EnhancedRAGDashboard() {
  const [activeTab, setActiveTab] = useState("prediction-aggregator")
  const [loading, setLoading] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictionAggregationResult | null>(null)
  const [rerankResult, setRerankResult] = useState<RerankResponse | null>(null)
  const [stats, setStats] = useState<any>(null)

  // Prediction Aggregator state
  const [task, setTask] = useState("ESG scoring for solar energy project")
  const [context, setContext] = useState(`
Project: Solar Farm Development
Financial Data: {
  "cost": 1500000,
  "roi": 0.18,
  "funding_source": "private",
  "apy_projection": 0.12
}
Ecological Data: {
  "carbon_impact": -150,
  "renewable_percent": 90,
  "material_sourcing": "recycled"
}
Social Data: {
  "job_creation": 30,
  "community_benefit": "high",
  "regulatory_alignment": "compliant"
}
  `.trim())

  // Cohere Rerank state
  const [query, setQuery] = useState("solar energy project ESG analysis")
  const [documents, setDocuments] = useState([
    "This document discusses solar energy projects and their environmental impact.",
    "Financial analysis of renewable energy investments.",
    "Social benefits of community solar programs.",
    "Technical specifications for photovoltaic systems.",
    "ESG scoring methodology for infrastructure projects.",
    "Carbon footprint reduction through solar energy.",
    "Community engagement in renewable energy projects.",
    "Regulatory compliance for solar installations."
  ].join('\n'))

  const testPredictionAggregator = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5002/rag/predict-aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          context
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPredictionResult(result)
      } else {
        console.error('Prediction aggregation failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error testing prediction aggregator:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCohereRerank = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5002/rag/rerank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          documents: documents.split('\n').filter(doc => doc.trim()),
          top_n: 5,
          context: {
            project_type: "solar_energy",
            domain: "renewable_energy",
            esg_focus: "environmental",
            prefer_recent: true
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        setRerankResult(result)
      } else {
        console.error('Cohere rerank failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error testing Cohere rerank:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const [aggResponse, rerankResponse] = await Promise.all([
        fetch('http://localhost:5002/rag/aggregation-stats'),
        fetch('http://localhost:5002/rag/rerank-stats')
      ])

      const aggStats = await aggResponse.json()
      const rerankStats = await rerankResponse.json()

      setStats({
        aggregation: aggStats.stats,
        rerank: rerankStats.stats
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced RAG Dashboard</h1>
          <p className="text-muted-foreground">
            Prediction Aggregator & Cohere Rerank Implementation
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Zap className="w-4 h-4 mr-2" />
          Advanced Features
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prediction-aggregator">
            <Brain className="w-4 h-4 mr-2" />
            Prediction Aggregator
          </TabsTrigger>
          <TabsTrigger value="cohere-rerank">
            <TrendingUp className="w-4 h-4 mr-2" />
            Cohere Rerank
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prediction-aggregator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Multi-Model Prediction Aggregation
              </CardTitle>
              <CardDescription>
                Fuse predictions from GPT-4, Gemini, Grok, Claude, and Qwen to reduce bias and improve accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Task</label>
                  <Input
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Enter task description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Context</label>
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Enter project context"
                    rows={8}
                  />
                </div>
              </div>

              <Button 
                onClick={testPredictionAggregator} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Aggregating Predictions...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Test Prediction Aggregation
                  </>
                )}
              </Button>

              {predictionResult && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Results</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Consensus Scores</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Financial:</span>
                            <span className="font-mono">{predictionResult.consensus_prediction.financial_score.toFixed(1)}</span>
                          </div>
                          <Progress value={predictionResult.consensus_prediction.financial_score} />
                          
                          <div className="flex justify-between">
                            <span>Ecological:</span>
                            <span className="font-mono">{predictionResult.consensus_prediction.ecological_score.toFixed(1)}</span>
                          </div>
                          <Progress value={predictionResult.consensus_prediction.ecological_score} />
                          
                          <div className="flex justify-between">
                            <span>Social:</span>
                            <span className="font-mono">{predictionResult.consensus_prediction.social_score.toFixed(1)}</span>
                          </div>
                          <Progress value={predictionResult.consensus_prediction.social_score} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Aggregation Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span className="font-mono">{(predictionResult.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bias Reduction:</span>
                            <span className="font-mono">{(predictionResult.bias_reduction * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Disagreement:</span>
                            <span className="font-mono">{(predictionResult.disagreement_score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Model Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(predictionResult.model_contributions).map(([model, contribution]) => (
                          <div key={model} className="text-center">
                            <div className="text-xs text-muted-foreground">{model}</div>
                            <div className="font-mono">{(contribution * 100).toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohere-rerank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Cohere Rerank
              </CardTitle>
              <CardDescription>
                Semantic re-ranking using Cohere's rerank API for improved document relevance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Query</label>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter search query"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Documents (one per line)</label>
                  <Textarea
                    value={documents}
                    onChange={(e) => setDocuments(e.target.value)}
                    placeholder="Enter documents to rerank"
                    rows={8}
                  />
                </div>
              </div>

              <Button 
                onClick={testCohereRerank} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Reranking Documents...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Test Cohere Rerank
                  </>
                )}
              </Button>

              {rerankResult && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Reranked Results</h3>
                  
                  <div className="space-y-2">
                    {rerankResult.results.slice(0, 5).map((result, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Rank {result.rerank_rank}</Badge>
                                <Badge variant="secondary">Score: {(result.relevance_score * 100).toFixed(1)}%</Badge>
                              </div>
                              <p className="text-sm">{result.document}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Total Requests</div>
                          <div className="font-mono">{rerankResult.performance_metrics.total_requests}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Avg Response Time</div>
                          <div className="font-mono">{rerankResult.performance_metrics.avg_response_time.toFixed(2)}ms</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                          <div className="font-mono">{(rerankResult.performance_metrics.success_rate * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Documents Processed</div>
                          <div className="font-mono">{rerankResult.performance_metrics.total_documents_processed}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Prediction Aggregation Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.aggregation ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Aggregations:</span>
                      <span className="font-mono">{stats.aggregation.total_aggregations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Bias Reduction:</span>
                      <span className="font-mono">{(stats.aggregation.avg_bias_reduction * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Disagreement:</span>
                      <span className="font-mono">{(stats.aggregation.avg_disagreement * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Confidence:</span>
                      <span className="font-mono">{(stats.aggregation.avg_confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Cohere Rerank Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.rerank ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Requests:</span>
                      <span className="font-mono">{stats.rerank.total_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time:</span>
                      <span className="font-mono">{stats.rerank.avg_response_time.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-mono">{(stats.rerank.success_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documents Processed:</span>
                      <span className="font-mono">{stats.rerank.total_documents_processed}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
