/**
 * DAO class for norm evolution with weighted voting.
 */
import { Agent, Metrics } from './Agent.js';

export class DAO {
  agents: Agent[];
  stakeholders: string[];
  proposals: any[];
  voteExpiry: number;

  constructor(agents: Agent[], stakeholders: string[]) {
    this.agents = agents;
    this.stakeholders = stakeholders;
    this.proposals = [];
    this.voteExpiry = 24 * 60 * 60 * 1000;
  }

  proposeNormUpdate(proposerId: string, newMetric: Partial<Metrics>, description: string) {
    try {
      if (!newMetric) throw new Error('Invalid metric');
      const proposal = {
        id: this.proposals.length + 1,
        proposerId,
        newMetric,
        description,
        votes: { for: 0, against: 0 },
        status: 'pending',
        createdAt: Date.now()
      };
      this.proposals.push(proposal);
      this.log(`[${proposerId}] Proposed norm update: ${description}`);
      return proposal;
    } catch (error) {
      this.log(`Proposal error: ${error.message}`);
    }
  }

  voteOnProposal(proposalId: number, voterId: string, vote: boolean) {
    try {
      const proposal = this.proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error('Proposal not found');
      const weight = this.getVoterWeight(voterId);
      proposal.votes[vote ? 'for' : 'against'] += weight;
      this.log(`[${voterId}] Voted ${vote ? 'for' : 'against'} proposal ${proposalId} (weight: ${weight})`);
      this.resolveProposal(proposal);
    } catch (error) {
      this.log(`Vote error: ${error.message}`);
    }
  }

  getVoterWeight(voterId: string): number {
    if (this.stakeholders.includes(voterId)) {
      if (voterId === 'community') return 2;
      if (voterId === 'experts') return 1.5;
      if (voterId === 'funders') return 1;
    }
    return 1;
  }

  resolveProposal(proposal: any) {
    const totalWeight = this.stakeholders.reduce((sum, voter) => sum + this.getVoterWeight(voter), 0);
    const voteCount = proposal.votes.for + proposal.votes.against;
    const isExpired = Date.now() - proposal.createdAt > this.voteExpiry;
    if (voteCount >= totalWeight || isExpired) {
      proposal.status = proposal.votes.for > proposal.votes.against ? 'approved' : 'rejected';
      this.log(`Proposal ${proposal.id} ${proposal.status}: ${proposal.description}`);
      if (proposal.status === 'approved') {
        this.agents.forEach(agent => {
          agent.goals = { ...agent.goals, ...proposal.newMetric };
          agent.log(`Updated goals: ${JSON.stringify(agent.goals)}`);
        });
      }
    }
  }

  log(message: string) {
    console.log(`[DAO] ${message}`);
  }
}