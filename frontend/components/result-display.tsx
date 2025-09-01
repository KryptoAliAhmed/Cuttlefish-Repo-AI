import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Terminal, Copy, Check, Download, ExternalLink } from "lucide-react"
import { useMemo, useState } from "react"
// If not installed, run: npm install react-markdown
import ReactMarkdown from "react-markdown"

export function ResultDisplay({ result }: { result: string }) {
  const [copied, setCopied] = useState(false)
  
  // Generate a stable slug for heading anchors
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 64)
  
  // Extract a concise summary from the first meaningful section or bullets
  const smartSummary = useMemo(() => {
    if (!result) return ""
    const lines = result.split(/\r?\n/)
    // Prefer lines under an Executive Summary/Key Insights heading
    let start = -1
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim().toLowerCase()
      if (l.startsWith("## executive summary") || l.startsWith("## key insights") || l.startsWith("## summary")) {
        start = i + 1
        break
      }
    }
    const collected: string[] = []
    const takeFrom = start >= 0 ? start : 0
    for (let i = takeFrom; i < lines.length && collected.length < 4; i++) {
      const l = lines[i].trim()
      if (!l) continue
      if (/^#{1,6}\s/.test(l)) {
        if (start >= 0) break
        else continue
      }
      // take bullet points or short sentences
      if (/^[-*]\s+/.test(l)) collected.push(l.replace(/^[-*]\s+/, ""))
      else if (l.length <= 200) collected.push(l)
    }
    return collected.join(" \n")
  }, [result])
  
  // Build a lightweight table of contents
  const toc = useMemo(() => {
    if (!result) return [] as { level: number; text: string; id: string }[]
    const entries: { level: number; text: string; id: string }[] = []
    result.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^(#{1,3})\s+(.+)$/)
      if (m) {
        const level = m[1].length
        const text = m[2].trim()
        entries.push({ level, text, id: slugify(text) })
      }
    })
    return entries.slice(0, 12)
  }, [result])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuttlefish_result_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800 dark:text-gray-200">
            <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            Agent Output
          </CardTitle>
          
          {result && (
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
                onClick={downloadResult}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          )}
        </div>
        {result && toc.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
                  t.level === 1
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                    : t.level === 2
                    ? "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300"
                    : "bg-slate-100 dark:bg-slate-700/40 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                }`}
              >
                {t.text}
              </a>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
          {result ? (
            <div className="prose prose-lg dark:prose-invert max-w-none p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-slate-600/50">
              {smartSummary && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/60 dark:border-pink-700/40">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Executive Summary</div>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {smartSummary.split(/\s+\\n/).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ReactMarkdown
                components={{
                  h1: ({ children }) => {
                    const text = String(children)
                    const id = slugify(text)
                    return <h1 id={id} className="scroll-mt-24 text-3xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-300 dark:border-slate-600 pb-2">{children}</h1>
                  },
                  h2: ({ children }) => {
                    const text = String(children)
                    const id = slugify(text)
                    return <h2 id={id} className="scroll-mt-24 text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">{children}</h2>
                  },
                  h3: ({ children }) => {
                    const text = String(children)
                    const id = slugify(text)
                    return <h3 id={id} className="scroll-mt-24 text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{children}</h3>
                  },
                  p: ({ children }) => <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm font-mono">{children}</code>
                    ) : (
                      <code className="block bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>
                    )
                  },
                  pre: ({ children }) => <pre className="bg-gray-200 dark:bg-slate-600 p-4 rounded-lg overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 py-2 rounded-r-lg">{children}</blockquote>,
                  table: ({ children }) => <div className="overflow-x-auto"><table className="min-w-full border-collapse border border-gray-300 dark:border-slate-600">{children}</table></div>,
                  th: ({ children }) => <th className="border border-gray-300 dark:border-slate-600 px-4 py-2 bg-gray-100 dark:bg-slate-700 font-semibold text-gray-800 dark:text-gray-200">{children}</th>,
                  td: ({ children }) => <td className="border border-gray-300 dark:border-slate-600 px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline flex items-center gap-1 inline-flex"
                    >
                      {children}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )
                }}
              >
                {result}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
              <Terminal className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Agent Output Ready
              </h3>
              <p className="text-gray-500 dark:text-gray-500 max-w-md">
                Execute an agent pipeline to see the results displayed here in a professional format.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
