/**
 * DAO class for norm evolution with weighted voting and persistence.
 * Version 0.5: Enhanced for Cuttlefish Labs with changelog, custom errors, and persistence.
 */
import type { Agent, Metrics } from "./Agent.js"
import { saveJSON } from "./persistence.js"

// Custom error classes
export class ProposalNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProposalNotFoundError"
  }
}

export class InvalidMetricError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidMetricError"
  }
}

export class ProposalNotPendingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProposalNotPendingError"
  }
}

export interface NormProposal {
  id: number
  proposerId: string
  newMetric: Partial<Metrics>
  description: string
  votes: { for: number; against: number; voters: { id: string; weight: number; vote: boolean }[] }
  status: "pending" | "approved" | "rejected"
  createdAt: number
}

export class DAO {
  agents: Agent[]
  stakeholders: string[]
  proposals: NormProposal[]
  norms: Partial<Metrics>[]
  changelog: string[]
  voteExpiry: number

  constructor(agents: Agent[], stakeholders: string[]) {
    this.agents = agents
    this.stakeholders = stakeholders
    this.proposals = []
    this.norms = []
    this.changelog = []
    this.voteExpiry = 24 * 60 * 60 * 1000 // 24 hours
  }

  proposeNormUpdate(proposerId: string, newMetric: Partial<Metrics>, description: string): NormProposal {
    if (!newMetric || !Object.keys(newMetric).length) {
      this.log(`[${proposerId}] Invalid metric for proposal: ${JSON.stringify(newMetric)}`)
      throw new InvalidMetricError("Metric must be non-empty")
    }
    if (!this.agents.some((agent) => agent.id === proposerId) && !this.stakeholders.includes(proposerId)) {
      this.log(`[${proposerId}] Invalid proposer ID`)
      throw new Error("Proposer not found among agents or stakeholders")
    }
    const proposal: NormProposal = {
      id: this.proposals.length + 1,
      proposerId,
      newMetric,
      description,
      votes: { for: 0, against: 0, voters: [] },
      status: "pending",
      createdAt: Date.now(),
    }
    this.proposals.push(proposal)
    this.log(`Proposed norm update #${proposal.id}: ${description} (Metric: ${JSON.stringify(newMetric)})`)
    this.saveState()
    return proposal
  }

  voteOnProposal(proposalId: number, voterId: string, vote: boolean) {
    try {
      const proposal = this.proposals.find((p) => p.id === proposalId)
      if (!proposal) {
        throw new ProposalNotFoundError(`Proposal ${proposalId} not found`)
      }
      if (proposal.status !== "pending") {
        throw new ProposalNotPendingError(`Proposal ${proposalId} is already ${proposal.status}`)
      }
      if (proposal.votes.voters.some((v) => v.id === voterId)) {
        this.log(`[${voterId}] Already voted on proposal ${proposalId}`)
        return
      }
      const weight = this.getVoterWeight(voterId)
      proposal.votes[vote ? "for" : "against"] += weight
      proposal.votes.voters.push({ id: voterId, weight, vote })
      this.log(`[${voterId}] Voted ${vote ? "for" : "against"} proposal ${proposalId} (weight: ${weight})`)
      this.resolveProposal(proposal)
      this.saveState()
    } catch (error: any) {
      this.log(`[${voterId}] Vote error on proposal ${proposalId}: ${error.message}`)
      throw error
    }
  }

  getVoterWeight(voterId: string): number {
    if (!this.stakeholders.includes(voterId)) {
      return 1 // Agent weight
    }
    return voterId === "community" ? 2 : voterId === "experts" ? 1.5 : 1
  }

  resolveProposal(proposal: NormProposal) {
    const totalWeight = this.stakeholders.reduce((sum, voter) => sum + this.getVoterWeight(voter), 0)
    const voteCount = proposal.votes.voters.reduce((sum, v) => sum + v.weight, 0)
    const isExpired = Date.now() - proposal.createdAt > this.voteExpiry

    if (voteCount >= totalWeight || isExpired) {
      proposal.status = proposal.votes.for > proposal.votes.against ? "approved" : "rejected"
      this.log(
        `Proposal ${proposal.id} ${proposal.status}: ${proposal.description} (For: ${proposal.votes.for}, Against: ${proposal.votes.against})`,
      )
      if (proposal.status === "approved") {
        this.norms.push(proposal.newMetric)
        this.changelog.push(
          `[${new Date().toLocaleString()}] Applied norm #${proposal.id}: ${JSON.stringify(proposal.newMetric)} by ${
            proposal.proposerId
          }`,
        )
        this.agents.forEach((agent) => {
          agent.goals = { ...agent.goals, ...proposal.newMetric }
          agent.log(`Updated goals after norm #${proposal.id}: ${JSON.stringify(agent.goals)}`)
        })
      }
      this.saveState()
    }
  }

  log(message: string) {
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "UTC" })
    const logEntry = `[${timestamp}][DAO] ${message}`
    console.log(logEntry)
    this.changelog.push(logEntry)
    if (this.changelog.length > 100) this.changelog.shift()
  }

  saveState() {
    saveJSON("daoGovernance.json", {
      proposals: this.proposals,
      norms: this.norms,
      changelog: this.changelog,
    })
  }
}
