import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollText, Cpu, CheckCircle, AlertTriangle, Copy, Check, Download, Trash2, Clock, Activity } from "lucide-react"
import { useState } from "react"
import type { AuditLogEntry } from "@/lib/types"

export function AuditLog({ logs }: { logs: AuditLogEntry[] }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      const logText = logs.map(log => 
        `[${log.timestamp}] ${log.layer} (${log.model}) - ${log.action}: ${log.details} (Confidence: ${(log.confidence * 100).toFixed(1)}%)`
      ).join('\n')
      
      await navigator.clipboard.writeText(logText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs
    }
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuttlefish_audit_log_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (confidence: number) => {
    if (confidence > 0.8) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (confidence > 0.6) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <AlertTriangle className="w-4 h-4 text-red-500" />
  }

  const getStatusColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600'
    if (confidence > 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600'
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <ScrollText className="w-5 h-5 text-white" />
            </div>
            Audit Log
          </CardTitle>
          
          {logs.length > 0 && (
            <div className="flex gap-2">
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
                onClick={downloadLogs}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          )}
        </div>
        
        {/* Log Statistics */}
        {logs.length > 0 && (
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Total Logs: {logs.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last: {logs.length > 0 ? formatTimestamp(logs[logs.length - 1].timestamp) : 'N/A'}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
              <ScrollText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Audit Log Ready
              </h3>
              <p className="text-gray-500 dark:text-gray-500 max-w-md">
                Execute an agent pipeline to see the detailed audit trail here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-4 border border-gray-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(log.confidence)}
                    </div>
                    
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                          {log.layer}
                        </h4>
                        <Badge className={`px-3 py-1 rounded-xl text-xs font-semibold ${getStatusColor(log.confidence)}`}>
                          {(log.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {log.model}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-gray-400">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Add Badge component if not imported
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
)
