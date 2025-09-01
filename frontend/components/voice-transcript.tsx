"use client"

import { useMemo } from "react"

type VoiceEntry = {
  id: string
  userQuestion: string
  agentAnswer: string
  timestamp: Date
}

export function VoiceTranscript({
  history,
  interimUser,
  isResponding,
  fullScreen,
}: {
  history: VoiceEntry[]
  interimUser?: string
  isResponding?: boolean
  fullScreen?: boolean
}) {
  const ordered = useMemo(() => {
    return [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [history])

  return (
    <div className={`${fullScreen ? "w-full h-full min-h-0 max-h-none" : "w-full h-full min-h-[400px] max-h-[600px]"} overflow-y-auto rounded-2xl bg-black/50 text-white border border-white/20 shadow-2xl backdrop-blur-md` }>
      <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-black/40 rounded-t-2xl">
        <div className="text-sm font-semibold">Live Transcript</div>
        <div className="text-xs opacity-70">Speak-to-speak session</div>
      </div>
      <div className="p-3 space-y-3">
        {ordered.length === 0 && !interimUser && (
          <div className="text-xs opacity-70">No messages yet. Start speaking…</div>
        )}

        {/* Render completed exchanges */}
        {ordered.map((e) => (
          <div key={e.id} className="space-y-2">
            {/* User bubble */}
            {e.userQuestion ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-blue-600 text-white text-sm">
                  <div className="opacity-80 text-[10px] mb-1">You</div>
                  <div className="whitespace-pre-wrap">{e.userQuestion}</div>
                </div>
              </div>
            ) : null}
            {/* Assistant bubble */}
            {e.agentAnswer ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-white/90 text-black text-sm">
                  <div className="opacity-70 text-[10px] mb-1">Assistant</div>
                  <div className="whitespace-pre-wrap">{e.agentAnswer}</div>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* Interim user speech (not yet answered) */}
        {interimUser && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-blue-500/80 text-white text-sm border border-blue-300/40">
              <div className="opacity-80 text-[10px] mb-1">You (listening…)</div>
              <div className="whitespace-pre-wrap">{interimUser}</div>
            </div>
          </div>
        )}

        {/* Assistant speaking indicator */}
        {isResponding && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3 py-2 bg-white/70 text-black text-xs">
              Speaking…
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceTranscript


