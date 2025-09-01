"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Tag, Flag, CheckCircle, Clock, AlertCircle } from "lucide-react"

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"}/rag/documents`
const API_KEY = "test-api-key" // Replace with secure storage in production

export function RagAdminDashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [tag, setTag] = useState("")
  const [flag, setFlag] = useState("")
  const [status, setStatus] = useState("")
  const [recent, setRecent] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setStatus("Please select a file.")
      return
    }
    setUploading(true)
    setStatus("")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("tag", tag)
    formData.append("flag", flag)
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`
        },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("Upload successful!")
        setRecent([{...data.meta, uploaded: new Date().toLocaleString()}, ...recent])
        setFile(null)
        setTag("")
        setFlag("")
      } else {
        setStatus(data.error || "Upload failed.")
      }
    } catch (err) {
      setStatus("Upload error.")
    }
    setUploading(false)
  }

  const getFlagIcon = (flagType: string) => {
    switch (flagType) {
      case "proposal": return "📋"
      case "grant": return "💰"
      case "technical": return "⚙️"
      default: return "📄"
    }
  }

  const getFlagColor = (flagType: string) => {
    switch (flagType) {
      case "proposal": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
      case "grant": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
      case "technical": return "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-transparent bg-clip-text">
            RAG Document Admin
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Manage and organize documents for the Retrieval Augmented Generation system
        </p>
      </div>

      {/* Upload Form Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white pb-8">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            Document Upload & Management
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Selection */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200">
                <FileText className="w-5 h-5 inline mr-2 text-orange-500" />
                Select Document
              </label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".json,.md,.pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="block w-full border-2 border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supported formats: JSON, Markdown, PDF
              </p>
            </div>

            {/* Tag Input */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200">
                <Tag className="w-5 h-5 inline mr-2 text-blue-500" />
                Document Tag
              </label>
              <Input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                placeholder="e.g., solar, governance, technical"
                className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
            </div>

            {/* Flag Selection */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200">
                <Flag className="w-5 h-5 inline mr-2 text-purple-500" />
                Document Flag
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 hover:scale-105 ${
                  flag === "proposal" 
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-lg' 
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                }`}>
                  <input 
                    type="radio" 
                    name="flag" 
                    value="proposal" 
                    checked={flag === "proposal"} 
                    onChange={e => setFlag(e.target.value)} 
                    className="accent-blue-600 w-5 h-5" 
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">📋</div>
                    <div className="font-semibold">Proposal</div>
                    <div className="text-sm text-gray-500">Governance & voting</div>
        </div>
            </label>
                
                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 hover:scale-105 ${
                  flag === "grant" 
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 shadow-lg' 
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-500'
                }`}>
                  <input 
                    type="radio" 
                    name="flag" 
                    value="grant" 
                    checked={flag === "grant"} 
                    onChange={e => setFlag(e.target.value)} 
                    className="accent-green-600 w-5 h-5" 
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="font-semibold">Grant</div>
                    <div className="text-sm text-gray-500">Funding & resources</div>
                  </div>
            </label>
                
                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 hover:scale-105 ${
                  flag === "technical" 
                    ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-400 dark:border-pink-600 shadow-lg' 
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-pink-300 dark:hover:border-pink-500'
                }`}>
                  <input 
                    type="radio" 
                    name="flag" 
                    value="technical" 
                    checked={flag === "technical"} 
                    onChange={e => setFlag(e.target.value)} 
                    className="accent-pink-600 w-5 h-5" 
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">⚙️</div>
                    <div className="font-semibold">Technical</div>
                    <div className="text-sm text-gray-500">Code & architecture</div>
                  </div>
            </label>
          </div>
        </div>

            {/* Upload Button */}
            <Button 
              type="submit" 
              disabled={uploading}
              className="w-full h-16 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-70"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Uploading Document...
                </>
              ) : (
                <>
                  <Upload className="mr-3 h-6 w-6" />
                  Upload Document
                </>
              )}
            </Button>

            {/* Status Message */}
            {status && (
              <div className={`mt-4 p-4 rounded-2xl text-center font-medium ${
                status.includes("successful") 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}>
                {status.includes("successful") ? (
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 inline mr-2" />
                )}
                {status}
              </div>
            )}
      </form>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 dark:text-gray-200">
            <Clock className="w-6 h-6 text-blue-500" />
            Recently Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {recent.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
        {recent.map((doc, idx) => (
                <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getFlagIcon(doc.flag)}</div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                          {doc.filename}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doc.num_chunks} chunks • Uploaded {doc.uploaded}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                        <Tag className="w-3 h-3 mr-1" />
                        {doc.tag || "untagged"}
                      </Badge>
                      <Badge className={`${getFlagColor(doc.flag)}`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {doc.flag || "general"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}