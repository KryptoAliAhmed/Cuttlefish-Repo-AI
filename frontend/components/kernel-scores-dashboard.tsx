"use client"
import { useEffect, useState } from "react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Leaf, Users, DollarSign, Target, BarChart3 } from "lucide-react"

interface KernelScore {
  project_name: string
  financial: any
  ecological: any
  social: any
}

export function KernelScoresDashboard() {
  const [scores, setScores] = useState<KernelScore[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
    fetch(`${API}/kernel/scores`)
      .then((res) => res.json())
      .then((data) => {
        setScores(data.kernel_scores || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredScores = filter
    ? scores.filter((score) => score[filter as keyof KernelScore]?.score)
    : scores

  const getFilterIcon = (filterType: string | null) => {
    switch (filterType) {
      case 'financial': return <DollarSign className="w-4 h-4" />
      case 'ecological': return <Leaf className="w-4 h-4" />
      case 'social': return <Users className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getFilterColor = (filterType: string | null) => {
    switch (filterType) {
      case 'financial': return 'from-blue-500 to-indigo-500'
      case 'ecological': return 'from-green-500 to-emerald-500'
      case 'social': return 'from-pink-500 to-rose-500'
      default: return 'from-purple-500 to-blue-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
    if (score >= 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
    return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-transparent bg-clip-text">
            Kernel Scores Dashboard
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Comprehensive scoring system for Financial, Ecological, and Social impact assessment
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            !filter 
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-purple-500/25' 
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
          }`}
          onClick={() => setFilter(null)}
        >
          <BarChart3 className="w-5 h-5" />
          All Kernels
        </button>
        
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            filter === 'financial' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-blue-500/25' 
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
          }`}
          onClick={() => setFilter('financial')}
        >
          <DollarSign className="w-5 h-5" />
          Financial
        </button>
        
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            filter === 'ecological' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent shadow-green-500/25' 
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-500'
          }`}
          onClick={() => setFilter('ecological')}
        >
          <Leaf className="w-5 h-5" />
          Ecological
        </button>
        
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            filter === 'social' 
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-pink-500/25' 
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-pink-300 dark:hover:border-pink-500'
          }`}
          onClick={() => setFilter('social')}
        >
          <Users className="w-5 h-5" />
          Social
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading kernel scores...</p>
          </div>
        </div>
      ) : (
        /* Projects Accordion */
        <Accordion type="single" collapsible className="w-full space-y-6">
          {filteredScores.map((score, idx) => (
            <AccordionItem 
              key={score.project_name + idx} 
              value={score.project_name + idx}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden"
            >
              <AccordionTrigger className="px-8 py-6 hover:no-underline group">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl">
                      <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                        {score.project_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to view detailed scores
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 rounded-xl font-semibold ${
                        getScoreColor(score.financial.score)
                      } border-current`}
                    >
                      Financial: {score.financial.score}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 rounded-xl font-semibold ${
                        getScoreColor(score.ecological.score)
                      } border-current`}
                    >
                      Ecological: {score.ecological.score}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 rounded-xl font-semibold ${
                        getScoreColor(score.social.score)
                      } border-current`}
                    >
                      Social: {score.social.score}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Financial Kernel */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-blue-800 dark:text-blue-200">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        Financial Kernel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Project Cost</span>
                        <span className="font-bold text-blue-600">${score.financial.project_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">ROI Potential</span>
                        <span className="font-bold text-green-600">{(score.financial.roi_potential * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Funding Source</span>
                        <Badge variant="outline" className="capitalize">{score.financial.funding_source}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">APY Projection</span>
                        <span className="font-bold text-purple-600">{(score.financial.apy_projection * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
                        <div className="text-3xl font-bold">{score.financial.score}</div>
                        <div className="text-blue-100">Financial Score</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ecological Kernel */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-green-800 dark:text-green-200">
                        <Leaf className="w-5 h-5 text-green-600" />
                        Ecological Kernel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Carbon Impact</span>
                        <span className={`font-bold ${score.ecological.carbon_impact < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {score.ecological.carbon_impact < 0 ? '+' : ''}{Math.abs(score.ecological.carbon_impact)} tons CO2
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Renewable Mix</span>
                        <span className="font-bold text-green-600">{score.ecological.renewable_percent_mix}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Material Sourcing</span>
                        <Badge variant="outline" className="capitalize">{score.ecological.material_sourcing}</Badge>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
                        <div className="text-3xl font-bold">{score.ecological.score}</div>
                        <div className="text-green-100">Ecological Score</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Kernel */}
                  <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-pink-800 dark:text-pink-200">
                        <Users className="w-5 h-5 text-pink-600" />
                        Social Kernel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Community Benefit</span>
                        <Badge variant="outline" className="capitalize">{score.social.community_benefit}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Job Creation</span>
                        <span className="font-bold text-blue-600">{score.social.job_creation} jobs</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Regulatory Status</span>
                        <Badge variant="outline" className="capitalize">{score.social.regulatory_alignment}</Badge>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white">
                        <div className="text-3xl font-bold">{score.social.score}</div>
                        <div className="text-pink-100">Social Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}