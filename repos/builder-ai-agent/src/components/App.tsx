"use client"

/**
 * Main React application for Cuttlefish Labs agent simulator.
 */
import { useState, useEffect } from "react"
import { Agent, type Metrics } from "../Agent.js"
import { Orchestrator } from "../Orchestrator.js"
import AgentCard from "./AgentCard.js"
import ExperimentForm from "./ExperimentForm.js"
import ProposalForm from "./ProposalForm.js"

function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [orchestrator, setOrchestrator] = useState<Orchestrator | null>(null)
  const [globalLogs, setGlobalLogs] = useState<string[]>([])
  const [daoLogs, setDaoLogs] = useState<string[]>([])

  useEffect(() => {
    const proposalAgent = new Agent("PropelAI", "ProposalAgent", 5, 100, 70)
    const riskAgent = new Agent("GuardBot", "RiskAgent", 5, 100, 70)
    const grantAgent = new Agent("FundFlow", "GrantAgent", 5, 100, 70)
    const initialAgents = [proposalAgent, riskAgent, grantAgent]

    const originalLog = Agent.prototype.log
    Agent.prototype.log = function (message: string) {
      originalLog.call(this, message)
      const logEntry = `[${new Date().toLocaleTimeString()}][${this.id}][${this.role}] ${message}`
      setGlobalLogs((prev) => [...prev, logEntry].slice(-100))
    }

    const orch = new Orchestrator(
      initialAgents,
      ["community", "experts", "funders"],
      import.meta.env.VITE_OPENAI_API_KEY || "mock-key",
    )
    setAgents(initialAgents)
    setOrchestrator(orch)

    return () => {
      Agent.prototype.log = originalLog
    }
  }, [])

  const updateState = () => {
    setAgents((prev) => [...prev])
    if (orchestrator) {
      setDaoLogs([...orchestrator.dao.changelog])
    }
  }

  const handleProposeExperiment = async (description: string, projectedMetrics: Metrics, isHighRisk: boolean) => {
    if (!orchestrator) return
    const input = { blueprint: { description, metrics: projectedMetrics, isHighRisk } }
    await orchestrator.runTask("Propose experiment", input)
    updateState()
  }

  const handleAttestExperiment = async (
    agentId: string,
    experimentId: number,
    actualMetrics: Metrics,
    sensorData: any,
  ) => {
    if (!orchestrator) return
    const agent = agents.find((a) => a.id === agentId)
    const experiment = agent?.experiments.find((e) => e.id === experimentId)
    if (!experiment || !agent) return

    agent.submitAttestation(experimentId, actualMetrics)
    const input = { experiment: { ...experiment, ownerId: agentId }, sensorData }
    await orchestrator.runTask("Assess and verify experiment", input)
    updateState()
  }

  const handleRemediateExperiment = async (agentId: string, experimentId: number, newMetrics: Metrics) => {
    const agent = agents.find((a) => a.id === agentId)
    if (agent) {
      try {
        agent.remediate(experimentId, newMetrics)
        updateState()
      } catch (error: any) {
        agent.log(`Failed to remediate experiment ${experimentId}: ${error.message}`)
        updateState()
      }
    }
  }

  const handleDraftProposal = async (project: string, metricsAlignment: Metrics) => {
    if (!orchestrator) return
    const input = { project, metricsAlignment }
    await orchestrator.runTask("Draft grant proposal", input)
    updateState()
  }

  const handleNormUpdate = async (newMetric: Partial<Metrics>, description: string) => {
    if (!orchestrator) return
    const input = { newMetric, description, proposerId: "WebAppUser" } // Assume user is a valid proposer
    orchestrator.dao.stakeholders.push("WebAppUser") // Temporarily add user to stakeholders
    await orchestrator.runTask("Propose norm update", input)
    orchestrator.dao.stakeholders.pop() // Clean up
    updateState()
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "20px auto", padding: "0 20px" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>Cuttlefish Labs Agent Simulator v0.5</h1>
      <ExperimentForm onPropose={handleProposeExperiment} />
      <ProposalForm onDraft={handleDraftProposal} onNormUpdate={handleNormUpdate} />
      <h2 style={{ textAlign: "center", marginTop: "40px", color: "#333" }}>Agent Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onAttest={handleAttestExperiment}
            onRemediate={handleRemediateExperiment}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "20px", marginTop: "40px" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", color: "#333" }}>Global Activity Log</h2>
          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              height: "300px",
              overflowY: "auto",
              backgroundColor: "#fff",
              borderRadius: "8px",
            }}
          >
            {globalLogs
              .slice()
              .reverse()
              .map((log, index) => (
                <p key={index} style={{ margin: "5px 0", fontSize: "0.9em", color: "#555" }}>
                  {log}
                </p>
              ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", color: "#333" }}>DAO Changelog</h2>
          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              height: "300px",
              overflowY: "auto",
              backgroundColor: "#fff",
              borderRadius: "8px",
            }}
          >
            {daoLogs
              .slice()
              .reverse()
              .map((log, index) => (
                <p key={index} style={{ margin: "5px 0", fontSize: "0.9em", color: "#005588" }}>
                  {log}
                </p>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
