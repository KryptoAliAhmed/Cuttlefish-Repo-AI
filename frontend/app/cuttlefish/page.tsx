'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Vault = {
  agent_id: string
  balances: Record<string, number>
  lp_positions: [string, string, number, number][]
}

type LogEntry = {
  id: string
  timestamp: number
  event: string
  details: Record<string, any>
}

// Use frontend proxy to avoid CORS/mixed content
const API_BASE = '/api/backend'

export default function CuttlefishDashboard() {
  const [agentId, setAgentId] = useState('demo-agent')
  const [prompt, setPrompt] = useState('Design a daydream cycle for a safe vault strategy')
  const [vault, setVault] = useState<Vault | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [cognize, setCognize] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [backendUp, setBackendUp] = useState<boolean | null>(null)

  const fetchVault = async () => {
    const res = await fetch(`${API_BASE}/treasury/vault?agent_id=${encodeURIComponent(agentId)}`, { cache: 'no-store' })
    const json = await res.json()
    if (json.ok) setVault(json.vault)
  }

  const fetchLogs = async () => {
    const res = await fetch(`${API_BASE}/treasury/logs?limit=50`, { cache: 'no-store' })
    const json = await res.json()
    if (json.ok) setLogs(json.logs)
  }

  const fetchCognize = async () => {
    const res = await fetch(`${API_BASE}/cognize/logs?limit=20`, { cache: 'no-store' })
    const json = await res.json()
    if (json.ok) setCognize(json.entries)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const ok = await fetch(`/api/backend/health`, { cache: 'no-store' }).then(r => r.ok)
        setBackendUp(ok)
      } catch {
        setBackendUp(false)
      }
      await fetchVault()
      await fetchLogs()
      await fetchCognize()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSeed = async () => {
    try {
      setLoading(true)
      const r1 = await fetch(`${API_BASE}/treasury/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agentId, token: 'USDC', amount: 100 }) })
      const r2 = await fetch(`${API_BASE}/treasury/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agentId, token: 'WETH', amount: 100 }) })
      if (!r1.ok || !r2.ok) console.error('Seed failed', r1.status, r2.status)
      await fetchVault(); await fetchLogs()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const onTick = async () => {
    try {
      setLoading(true)
      const r = await fetch(`${API_BASE}/treasury/agent/tick`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agentId, opportunities: [{ tokenA: 'USDC', tokenB: 'WETH', expectedApyBps: 500 }] }) })
      if (!r.ok) console.error('Tick failed', r.status)
      await fetchVault(); await fetchLogs()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const onCognize = async () => {
    try {
      setLoading(true)
      const r = await fetch(`${API_BASE}/cognize/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      if (!r.ok) console.error('Cognize failed', r.status)
      await fetchCognize()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-purple-500/20 bg-black/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Cuttlefish Dashboard</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-purple-300 hover:text-white">Home</Link>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {backendUp === false && (
          <div className="rounded border border-red-500/30 bg-red-900/20 text-red-200 px-3 py-2 text-sm">
            Backend unreachable. Set NEXT_PUBLIC_BACKEND_URL and start the API server.
          </div>
        )}
        {backendUp === true && (
          <div className="rounded border border-emerald-500/30 bg-emerald-900/20 text-emerald-200 px-3 py-2 text-sm">
            Connected to backend.
          </div>
        )}
        <h1 className="text-2xl font-semibold">Cuttlefish Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 border border-purple-500/20 rounded p-4 bg-white/5">
            <h2 className="font-medium">Controls</h2>
            <label className="block text-sm">Agent ID</label>
            <input className="border rounded px-2 py-1 w-full bg-black/30 border-purple-500/30" value={agentId} onChange={e => setAgentId(e.target.value)} />

            <button disabled={loading} onClick={onSeed} className="bg-blue-600 text-white px-3 py-1 rounded mt-2">Seed Balances</button>
            <button disabled={loading} onClick={onTick} className="bg-emerald-600 text-white px-3 py-1 rounded mt-2">Agent Tick</button>

            <label className="block text-sm mt-4">Prompt</label>
            <textarea className="border rounded px-2 py-1 w-full h-24 bg-black/30 border-purple-500/30" value={prompt} onChange={e => setPrompt(e.target.value)} />
            <button disabled={loading} onClick={onCognize} className="bg-purple-600 text-white px-3 py-1 rounded mt-2">Run Cognize</button>
          </div>

          <div className="space-y-3 border border-purple-500/20 rounded p-4 bg-white/5">
            <h2 className="font-medium">Vault</h2>
            {vault ? (
              <div>
                <div className="text-sm text-purple-300/80">Agent: {vault.agent_id}</div>
                <h3 className="mt-2 font-medium">Balances</h3>
                <ul className="text-sm list-disc pl-4">
                  {Object.entries(vault.balances).map(([t, a]) => (
                    <li key={t}>{t}: {a}</li>
                  ))}
                </ul>
                <h3 className="mt-2 font-medium">LP Positions</h3>
                <ul className="text-sm list-disc pl-4">
                  {vault.lp_positions.map((pos, i) => (
                    <li key={i}>{pos[0]}-{pos[1]}: {pos[2]} / {pos[3]}</li>
                  ))}
                </ul>
              </div>
            ) : <div className="text-sm">No vault yet</div>}
          </div>

          <div className="space-y-3 border border-purple-500/20 rounded p-4 bg-white/5">
            <h2 className="font-medium">TrustGraph (Cognize)</h2>
            <div className="space-y-2 max-h-64 overflow-auto text-sm">
              {cognize.map((e, i) => (
                <div key={i} className="border border-purple-500/20 rounded p-2 bg-black/20">
                  <div className="text-purple-300/80">{new Date((e.timestamp || 0) * 1000).toLocaleString()}</div>
                  <div className="font-medium">{e.type}</div>
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(e.payload, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 border border-purple-500/20 rounded p-4 bg-white/5">
          <h2 className="font-medium">Treasury Logs</h2>
          <div className="space-y-2 max-h-80 overflow-auto text-sm">
            {logs.map(l => (
              <div key={l.id} className="border border-purple-500/20 rounded p-2 bg-black/20">
                <div className="text-purple-300/80">{new Date(l.timestamp * 1000).toLocaleString()}</div>
                <div className="font-medium">{l.event}</div>
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(l.details, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


