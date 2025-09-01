"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, Target, DollarSign, Users, Zap, Rocket, CheckCircle, Clock, AlertCircle, Cpu, Link, Shield } from "lucide-react"

const milestones = [
  { name: "Multi-sig Treasury Deployment", status: "completed", progress: 100, description: "Secure treasury wallet with 4/4 multi-signature setup" },
  { name: "AI Trading Agents Development", status: "in-progress", progress: 75, description: "Autonomous trading algorithms with risk management" },
  { name: "Chainlink Oracle Integration", status: "in-progress", progress: 60, description: "Real-time price feeds and data verification" },
  { name: "zkML Implementation", status: "pending", progress: 0, description: "Zero-knowledge machine learning for privacy-preserving AI" },
  { name: "Performance NFT System", status: "pending", progress: 0, description: "Dynamic NFT rewards based on trading performance" },
]

const metrics = [
  { label: "Projected APY", value: "15-25%", icon: Target, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { label: "Grant Amount", value: "$50,000", icon: DollarSign, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { label: "Target Users", value: "500+", icon: Users, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  { label: "Network", value: "Arbitrum One", icon: Zap, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="w-5 h-5 text-green-500" />
    case "in-progress": return <Clock className="w-5 h-5 text-blue-500" />
    case "pending": return <AlertCircle className="w-5 h-5 text-gray-400" />
    default: return <Clock className="w-5 h-5 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600"
    case "in-progress": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600"
    case "pending": return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
    default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
  }
}

export function ArbitrumGrantStatus() {
  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
            Arbitrum Grant Application
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          AI-Driven Autonomous Trading Swarm for Cuttlefish Labs Treasury
        </p>
      </div>

      {/* Grant Overview Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white pb-8">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            Grant Application Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div key={index} className={`text-center p-6 rounded-2xl ${metric.bgColor} border border-current/20`}>
                <metric.icon className={`w-10 h-10 mx-auto mb-3 ${metric.color}`} />
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">{metric.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{metric.label}</p>
              </div>
            ))}
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600 px-4 py-2 text-base">
              <CheckCircle className="w-4 h-4 mr-2" />
              Application Submitted
            </Badge>
            <Badge variant="outline" className="bg-white/80 text-white border-white/30 px-4 py-2 text-base">
              Under Review
            </Badge>
            <Button size="lg" variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-white/50 rounded-xl px-6 py-2">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Application
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Development Milestones */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
            <Rocket className="w-6 h-6 text-purple-500" />
            Development Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(milestone.status)}
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                        {milestone.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`px-4 py-2 rounded-xl font-semibold ${getStatusColor(milestone.status)}`}
                  >
                    {milestone.status.replace("-", " ")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Progress value={milestone.progress} className="h-3 rounded-full" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {milestone.progress}% complete
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {milestone.progress === 100 ? "Completed" : milestone.progress === 0 ? "Not Started" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Architecture */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
            <Cpu className="w-6 h-6 text-blue-500" />
            Technical Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Core Components */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Core Components
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">CreatorMultiSig Treasury</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Secure multi-signature wallet</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">CuttlefishVault</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Yield management & optimization</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">BuilderAgentFactory</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI agent creation & management</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-700">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">PredictiveAgent</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered trading strategies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-500" />
                External Integrations
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200 dark:border-red-700">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">Chainlink Price Feeds</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time market data & oracles</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-700">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">Uniswap V3 Router</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">DEX integration & liquidity</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-700">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">zkML Verification</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Privacy-preserving AI validation</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border border-pink-200 dark:border-pink-700">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">Vibekit</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Low-latency AI inference</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
