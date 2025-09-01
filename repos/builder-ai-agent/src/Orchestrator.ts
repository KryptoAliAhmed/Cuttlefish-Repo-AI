/**
 * OpenHands-style orchestrator for multi-agent collaboration.
 */
import { OpenAI } from "langchain/llms/openai"
import { type AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents"
import { ChainTool } from "langchain/tools"
import type { Agent } from "./Agent.js"
import { DAO } from "./DAO.js"
import { parseBlueprint } from "./utils.js"

export class Orchestrator {
  agents: Agent[]
  dao: DAO
  executor: AgentExecutor | null = null

  constructor(agents: Agent[], stakeholders: string[], llmApiKey: string) {
    this.agents = agents
    this.dao = new DAO(agents, stakeholders)
    this.initializeExecutor(llmApiKey).then((executor) => {
      this.executor = executor
    })
  }

  private async initializeExecutor(apiKey: string): Promise<AgentExecutor> {
    const llm = new OpenAI({ apiKey, temperature: 0.2, modelName: "gpt-4o" })
    const tools = [
      new ChainTool({
        name: "ProposalTool",
        description: "Propose an infrastructure experiment with metrics.",
        chain: async (input: string) => {
          const { blueprint, isHighRisk } = parseBlueprint(input)
          const agent = this.agents.find((a) => a.role === "ProposalAgent")
          if (!agent) throw new Error("No ProposalAgent found")
          const result = await agent.executeTask("propose", { blueprint, isHighRisk })
          return JSON.stringify(result)
        },
      }),
      new ChainTool({
        name: "RiskAssessmentTool",
        description: "Assess risk and verify an experiment.",
        chain: async (input: string) => {
          const { experiment, sensorData } = parseBlueprint(input)
          const agent = this.agents.find((a) => a.role === "RiskAgent")
          if (!agent) throw new Error("No RiskAgent found")
          const result = await agent.executeTask("assessRisk", { experiment, sensorData })
          return JSON.stringify(result)
        },
      }),
      new ChainTool({
        name: "GrantProposalTool",
        description: "Draft a grant proposal for funding.",
        chain: async (input: string) => {
          const { project, metricsAlignment } = parseBlueprint(input)
          const agent = this.agents.find((a) => a.role === "GrantAgent")
          if (!agent) throw new Error("No GrantAgent found")
          const result = await agent.executeTask("draftProposal", { project, metricsAlignment })
          return JSON.stringify(result)
        },
      }),
      new ChainTool({
        name: "NormUpdateTool",
        description: "Propose a norm update via DAO.",
        chain: async (input: string) => {
          const { newMetric, description, proposerId } = parseBlueprint(input)
          const proposal = this.dao.proposeNormUpdate(proposerId, newMetric, description)
          if (proposal) {
            // Simulate stakeholders voting
            this.dao.stakeholders.forEach((stakeholder) => {
              this.dao.voteOnProposal(proposal.id, stakeholder, Math.random() > 0.5)
            })
          }
          return JSON.stringify(proposal)
        },
      }),
    ]

    return initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "zero-shot-react-description",
      verbose: true,
    })
  }

  async runTask(task: string, input: any) {
    if (!this.executor) {
      console.error("Executor not initialized yet.")
      return "Executor not ready."
    }
    console.log("🚀 Orchestrator running task:", task)
    const result = await this.executor.call({ input: JSON.stringify(input) })
    console.log("✅ Orchestrator result:", result.output)
    return result.output
  }
}
