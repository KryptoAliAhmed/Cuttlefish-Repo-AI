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
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  X,
  File,
  BookOpen,
  Code,
  Database,
  Settings,
  Sparkles
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"

interface DocumentIngestionResponse {
  status: string
  document_id: string
  chunks_created: number
  processing_time: number
  quality_score: number
  suggestions: string[]
}

interface DocumentMetadata {
  id: string
  name: string
  type: string
  size: number
  chunks: number
  quality_score: number
  upload_date: string
  tags: string[]
  status: 'processing' | 'completed' | 'error'
}

export function DocumentIngestionWidget() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileType, setFileType] = useState("markdown")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [processingResults, setProcessingResults] = useState<DocumentIngestionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setFileName(file.name)
    
    // Determine file type
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'md' || ext === 'markdown') {
      setFileType('markdown')
    } else if (ext === 'json') {
      setFileType('json')
    } else if (ext === 'txt') {
      setFileType('text')
    } else {
      setFileType('markdown')
    }
    
    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const processDocument = async () => {
    if (!fileContent.trim()) {
      setError("Please provide document content")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${API_BASE}/api/documents/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_content: fileContent,
          file_name: fileName || 'untitled',
          file_type: fileType,
          tags: tags,
          metadata: {
            upload_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            content_length: fileContent.length
          }
        })
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result: DocumentIngestionResponse = await response.json()
      setProcessingResults(result)

      // Add to documents list
      const newDoc: DocumentMetadata = {
        id: result.document_id,
        name: fileName || 'untitled',
        type: fileType,
        size: fileContent.length,
        chunks: result.chunks_created,
        quality_score: result.quality_score,
        upload_date: new Date().toISOString(),
        tags: tags,
        status: 'completed'
      }

      setDocuments(prev => [newDoc, ...prev])

      // Reset form
      setSelectedFile(null)
      setFileContent("")
      setFileName("")
      setTags([])
      setProcessingResults(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return <FileText className="w-4 h-4" />
      case 'json':
        return <Code className="w-4 h-4" />
      case 'text':
        return <File className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Main Upload Card */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <span>Document Ingestion</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              <Sparkles className="w-3 h-3 mr-1" /> Enhanced
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              selectedFile 
                ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-900/20' 
                : 'border-slate-300 dark:border-slate-600 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-900/10'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!selectedFile ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    Drop your document here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or click to browse files
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-white dark:bg-slate-800"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {getFileTypeIcon(fileType)}
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setFileContent("")
                      setFileName("")
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.json,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="hidden"
            />
          </div>

          {/* Document Content Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Document Content
              </Label>
              <div className="flex items-center gap-2">
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Textarea
              ref={textAreaRef}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Enter or paste your document content here..."
              className="min-h-[200px] resize-none"
            />
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{fileContent.length} characters</span>
              <span>{fileContent.split('\n').length} lines</span>
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Document Name
                </Label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter document name"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Processing document...</span>
                <span className="text-gray-600 dark:text-gray-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Processing Results */}
          {processingResults && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Document processed successfully!
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Chunks created:</span>
                  <span className="ml-2 font-medium">{processingResults.chunks_created}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Processing time:</span>
                  <span className="ml-2 font-medium">{processingResults.processing_time.toFixed(2)}s</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Quality score:</span>
                  <span className={`ml-2 font-medium ${getQualityColor(processingResults.quality_score)}`}>
                    {(processingResults.quality_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="ml-2">{getQualityBadge(processingResults.quality_score)}</span>
                </div>
              </div>
              
              {processingResults.suggestions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggestions:</span>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {processingResults.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <BookOpen className="w-4 h-4" />
              <span>{documents.length} documents ingested</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null)
                  setFileContent("")
                  setFileName("")
                  setTags([])
                  setError(null)
                  setProcessingResults(null)
                }}
              >
                Clear
              </Button>
              <Button
                onClick={processDocument}
                disabled={isUploading || !fileContent.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Process Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
              Ingested Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      {getFileTypeIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{doc.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{doc.chunks} chunks</span>
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Quality</div>
                      <div className={`font-medium ${getQualityColor(doc.quality_score)}`}>
                        {(doc.quality_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    {getQualityBadge(doc.quality_score)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DocumentIngestionWidget
