import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, Copy, Check, Download, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export function ContextWindow({ context }: { context: string }) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(context)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadContext = () => {
    const blob = new Blob([context], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuttlefish_context_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Live Context Window
          </CardTitle>
          
          {context && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleExpanded}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {isExpanded ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Expand
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadContext}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'min-h-[600px]' : 'min-h-[400px]'
        } max-h-[800px] overflow-y-auto`}>
          {context ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
              <div className="mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Context Building in Real-time...
                </span>
              </div>
              
              <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200 leading-relaxed bg-white/60 dark:bg-slate-700/60 p-4 rounded-xl border border-blue-200/30 dark:border-blue-600/30 overflow-x-auto">
                {context}
              </pre>
              
              <div className="mt-4 text-xs text-blue-600 dark:text-blue-400">
                Context length: {context.length} characters | Words: {context.split(/\s+/).length}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
              <Layers className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Context Window Ready
              </h3>
              <p className="text-gray-500 dark:text-gray-500 max-w-md">
                Execute an agent pipeline to see the real-time context building process here.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
