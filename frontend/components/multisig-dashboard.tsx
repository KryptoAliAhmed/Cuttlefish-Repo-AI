"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Users, Shield, CheckCircle, Clock, ExternalLink, Wallet, Send, AlertTriangle } from "lucide-react"

interface Transaction {
  id: number
  destination: string
  value: string
  description: string
  confirmations: number
  requiredConfirmations: number
  executed: boolean
  submittedBy: string
  timestamp: string
}

interface Creator {
  name: string
  address: string
  avatar: string
  role: string
}

const mockCreators: Creator[] = [
  { name: "David Elze", address: "0xDavidElzeAddress", avatar: "👨‍💻", role: "Lead Developer" },
  { name: "ChatGPT", address: "0xChatGPTAddress", avatar: "🤖", role: "AI Assistant" },
  { name: "Grok", address: "0xGrokAddress", avatar: "🧠", role: "AI Analyst" },
  { name: "Gemini", address: "0xGeminiAddress", avatar: "💎", role: "AI Strategist" },
]

const mockTransactions: Transaction[] = [
  {
    id: 1,
    destination: "0x742d35Cc6634C0532925a3b8D4C9db96590fcaF4",
    value: "5.0",
    description: "Fund development team for Q1 2025",
    confirmations: 2,
    requiredConfirmations: 3,
    executed: false,
    submittedBy: "David Elze",
    timestamp: "2025-01-15T10:30:00Z",
  },
  {
    id: 2,
    destination: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    value: "10.0",
    description: "Purchase UNI tokens for treasury diversification",
    confirmations: 3,
    requiredConfirmations: 3,
    executed: true,
    submittedBy: "Grok",
    timestamp: "2025-01-14T15:45:00Z",
  },
]

export function MultisigDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [newTx, setNewTx] = useState({
    destination: "",
    value: "",
    description: "",
  })

  const handleSubmitTransaction = () => {
    if (!newTx.destination || !newTx.value || !newTx.description) return

    const transaction: Transaction = {
      id: transactions.length + 1,
      destination: newTx.destination,
      value: newTx.value,
      description: newTx.description,
      confirmations: 1,
      requiredConfirmations: 3,
      executed: false,
      submittedBy: "Current User",
      timestamp: new Date().toISOString(),
    }

    setTransactions([transaction, ...transactions])
    setNewTx({ destination: "", value: "", description: "" })
  }

  const handleConfirmTransaction = (txId: number) => {
    setTransactions(
      transactions.map((tx) =>
        tx.id === txId
          ? {
              ...tx,
              confirmations: Math.min(tx.confirmations + 1, tx.requiredConfirmations),
              executed: tx.confirmations + 1 >= tx.requiredConfirmations,
            }
          : tx,
      ),
    )
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const txTime = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - txTime.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
            Creator MultiSig Treasury
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Secure multi-signature wallet for Cuttlefish Labs creators with AI-powered governance
        </p>
      </div>

      {/* Treasury Overview Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white pb-8">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            Treasury Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {/* Creators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mockCreators.map((creator, index) => (
              <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="text-4xl mb-3">{creator.avatar}</div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-1">
                    {creator.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {creator.role}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                    {creator.address.slice(0, 8)}...{creator.address.slice(-6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Treasury Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 dark:border-slate-700/50">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Owners</div>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 dark:border-slate-700/50">
              <Shield className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">3/4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Required Confirmations</div>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 dark:border-slate-700/50">
              <Wallet className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">127.5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">ETH Balance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submit New Transaction */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
              <Send className="w-6 h-6 text-green-500" />
              Submit New Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Destination Address
              </label>
              <Input
                value={newTx.destination}
                onChange={(e) => setNewTx({ ...newTx, destination: e.target.value })}
                placeholder="0x..."
                className="border-2 border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:border-green-500 dark:focus:border-green-400 transition-all duration-300"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Value (ETH)
              </label>
              <Input
                type="number"
                value={newTx.value}
                onChange={(e) => setNewTx({ ...newTx, value: e.target.value })}
                placeholder="0.0"
                className="border-2 border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:border-green-500 dark:focus:border-green-400 transition-all duration-300"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Description
              </label>
              <Textarea
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                placeholder="Purpose of this transaction..."
                rows={3}
                className="border-2 border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:border-green-500 dark:focus:border-green-400 transition-all duration-300 resize-none"
              />
            </div>
            <Button 
              onClick={handleSubmitTransaction} 
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Transaction
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
              <Clock className="w-6 h-6 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Transaction #2 executed successfully</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">2h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Grok confirmed transaction #1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
                <Users className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200">David Elze submitted transaction #1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">6h ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Pending Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {transactions
              .filter((tx) => !tx.executed)
              .map((tx) => (
                <div key={tx.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-700 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline" className="bg-white/80 text-gray-700 border-gray-300">
                          TX #{tx.id}
                        </Badge>
                        <Badge
                          variant={tx.confirmations >= tx.requiredConfirmations ? "default" : "secondary"}
                          className={
                            tx.confirmations >= tx.requiredConfirmations
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600"
                          }
                        >
                          {tx.confirmations}/{tx.requiredConfirmations} Confirmations
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3">
                        {tx.description}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-semibold">To:</span>
                          <div className="font-mono bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 mt-1">
                            {tx.destination.slice(0, 12)}...{tx.destination.slice(-8)}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">Value:</span>
                          <div className="font-bold text-lg text-gray-800 dark:text-gray-200 mt-1">
                            {tx.value} ETH
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">Submitted by:</span>
                          <div className="mt-1">{tx.submittedBy}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 ml-6">
                      {tx.confirmations < tx.requiredConfirmations && (
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmTransaction(tx.id)}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2"
                        >
                          Confirm
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="rounded-xl px-4 py-2">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Executed Transactions */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Executed Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {transactions
              .filter((tx) => tx.executed)
              .map((tx) => (
                <div key={tx.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline" className="bg-white/80 text-gray-700 border-gray-300">
                          TX #{tx.id}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Executed
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3">
                        {tx.description}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-semibold">To:</span>
                          <div className="font-mono bg-white/50 dark:bg-slate-700/50 rounded-lg p-2 mt-1">
                            {tx.destination.slice(0, 12)}...{tx.destination.slice(-8)}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">Value:</span>
                          <div className="font-bold text-lg text-gray-800 dark:text-gray-200 mt-1">
                            {tx.value} ETH
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">Submitted by:</span>
                          <div className="mt-1">{tx.submittedBy}</div>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl px-4 py-2">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
