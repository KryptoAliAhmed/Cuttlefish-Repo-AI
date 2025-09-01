// pages/agents/[name].jsx

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function AgentDetail() {
  const router = useRouter()
  const { name } = router.query

  const [memoryLogs, setMemoryLogs] = useState([])
  const [strategies, setStrategies] = useState([])

  useEffect(() => {
    if (!name) return

    // Fetch mock memory logs from IPFS or backend
    fetch(`/api/agents/${name}/memory`)
      .then(res => res.json())
      .then(setMemoryLogs)

    // Fetch prediction strategies or logs
    fetch(`/api/agents/${name}/strategies`)
      .then(res => res.json())
      .then(setStrategies)
  }, [name])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Agent: {name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Memory Logs</h2>
            <ScrollArea className="h-64">
              <ul className="text-sm">
                {memoryLogs.map((log, i) => (
                  <li key={i} className="mb-1">
                    <Badge variant="outline" className="mr-2 text-xs">{log.timestamp}</Badge>
                    {log.entry}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Prediction Strategies</h2>
            <ul className="text-sm">
              {strategies.map((strat, i) => (
                <li key={i} className="mb-2">
                  <p><strong>Prompt:</strong> {strat.prompt}</p>
                  <p><strong>Confidence:</strong> {strat.confidence}</p>
                  <p className="text-xs text-muted-foreground">{strat.timestamp}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
