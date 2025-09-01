/**
 * OpenHands-style orchestrator for multi-agent collaboration.
 */
import { Agent, Metrics } from './Agent';
import { TrustGraph } from './TrustGraph';
import { DAO } from './DAO';
import { parseBlueprint } from './utils';

export class Orchestrator {
  agents: Agent[];
  trustGraph: TrustGraph;
  dao: DAO;

  constructor(agents: Agent[], stakeholders: string[], llmApiKey: string) {
    this.agents = agents;
    this.trustGraph = new TrustGraph(agents);
    this.dao = new DAO(agents, stakeholders);
  }

  private async executeTaskDirectly(task: string, input: any) {
    switch (task) {
      case 'propose':
        const { blueprint, isHighRisk } = input;
        const proposalAgent = this.agents.find(a => a.role === 'ProposalAgent');
        if (!proposalAgent) throw new Error('No ProposalAgent found');
        return await proposalAgent.executeTask('propose', { blueprint, isHighRisk });
      
      case 'assessRisk':
        const { experiment, sensorData } = input;
        const riskAgent = this.agents.find(a => a.role === 'RiskAgent');
        if (!riskAgent) throw new Error('No RiskAgent found');
        const result = await riskAgent.executeTask('assessRisk', { experiment, sensorData });
        this.trustGraph.evaluateExperiment(this.agents.find(a => a.id === experiment.ownerId)!, experiment, sensorData);
        return result;
      
      case 'draftProposal':
        const { project, metricsAlignment } = input;
        const grantAgent = this.agents.find(a => a.role === 'GrantAgent');
        if (!grantAgent) throw new Error('No GrantAgent found');
        return await grantAgent.executeTask('draftProposal', { project, metricsAlignment });
      
      case 'normUpdate':
        const { newMetric, description } = input;
        const proposal = this.dao.proposeNormUpdate('Agent_X', newMetric, description);
        if (proposal) {
          this.dao.stakeholders.forEach(stakeholder => {
            this.dao.voteOnProposal(proposal.id, stakeholder, Math.random() > 0.5);
          });
        }
        return proposal;
      
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async runTask(task: string, input: any) {
    console.log('🚀 Orchestrator running task:', task);
    const result = await this.executeTaskDirectly(task, input);
    console.log('✅ Orchestrator result:', result);
    return result;
  }
}