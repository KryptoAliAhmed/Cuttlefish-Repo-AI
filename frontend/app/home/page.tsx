"use client"

import dynamic from "next/dynamic"
import { RAGAgent } from "@/components/rag-agent"
import { CuttlefishDashboard } from "@/components/cuttlefish-dashboard"
import { KernelScoresDashboard } from "@/components/kernel-scores-dashboard"
import { MultisigDashboard } from "@/components/multisig-dashboard"

// Client-only to avoid SSR localStorage errors
const RAGChatClient = dynamic(() => import("@/components/rag-chat"), { ssr: false })

export default function HomeShowcase() {
  return (
    <main className="min-h-screen w-full bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4">RAG Chat</h2>
          <div className="rounded-lg border border-purple-500/40 p-4 bg-black/60">
            <RAGChatClient />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">RAG Agent</h2>
          <div className="rounded-lg border border-purple-500/40 p-4 bg-black/60">
            <RAGAgent />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Cuttlefish Dashboard</h2>
          <div className="rounded-lg border border-purple-500/40 p-4 bg-black/60">
            <CuttlefishDashboard />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Kernel Scores</h2>
          <div className="rounded-lg border border-purple-500/40 p-4 bg-black/60">
            <KernelScoresDashboard />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Multisig Dashboard</h2>
          <div className="rounded-lg border border-purple-500/40 p-4 bg-black/60">
            <MultisigDashboard />
          </div>
        </section>
      </div>
    </main>
  )
}




