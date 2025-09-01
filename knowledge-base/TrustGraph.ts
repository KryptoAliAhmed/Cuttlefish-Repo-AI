/**
 * TrustGraph class for peer evaluation and reputation management.
 */
import { Agent, Metrics, Experiment } from './Agent.js';
import { simpleHash } from './utils.js';

export class TrustGraph {
  agents: Agent[];
  trustScores: Map<string, number>;

  constructor(agents: Agent[]) {
    this.agents = agents;
    this.trustScores = new Map();
    agents.forEach(agent => this.trustScores.set(agent.id, agent.reputation));
  }

  evaluateExperiment(agent: Agent, experiment: Experiment, sensorData: any) {
    try {
      const actual = experiment.actualMetrics;
      const expected = agent.goals;
      let scoreAdjustment = 0;

      if (!actual || !expected) throw new Error('Invalid metrics');

      if (actual.ecological < expected.ecological * 0.8) {
        scoreAdjustment -= 12;
        agent.log(`Experiment ${experiment.id} failed ecological metric (${actual.ecological} < ${expected.ecological * 0.8})`);
      }
      if (actual.social < expected.social * 0.9) {
        scoreAdjustment -= 8;
        agent.log(`Experiment ${experiment.id} failed social metric (${actual.social} < ${expected.social * 0.9})`);
      }
      if (actual.financial >= expected.financial) {
        scoreAdjustment += 5;
        agent.log(`Experiment ${experiment.id} achieved financial target`);
      }

      const isValid = this.verifyZKP(agent.attestations.filter(a => a.experimentId === experiment.id), sensorData);
      if (!isValid) {
        scoreAdjustment -= 10;
        agent.log(`Experiment ${experiment.id} failed ZKP verification`);
      }

      this.updateTrustScore(agent.id, scoreAdjustment);
      if (scoreAdjustment < 0 && experiment.riskBand === 'high') {
        agent.escrowLocked += 30;
        agent.log(`Escrow lockup (${agent.escrowLocked}) due to high-risk failure`);
      }
    } catch (error) {
      agent.log(`Evaluation error: ${error.message}`);
    }
  }

  verifyZKP(attestations: any[], sensorData: any) {
    const latest = attestations[attestations.length - 1];
    if (!latest) return false;
    const isValid = simpleHash(JSON.stringify(sensorData)) === latest.hash;
    if (Math.random() < 0.1) {
      console.log('Random audit triggered');
      return isValid && Math.random() > 0.2;
    }
    return isValid;
  }

  updateTrustScore(agentId: string, adjustment: number) {
    let score = this.trustScores.get(agentId)! + adjustment;
    score = Math.max(0, Math.min(100, score));
    this.trustScores.set(agentId, score);
    console.log(`[${agentId}] Trust score updated to ${score}`);
    const agent = this.agents.find(a => a.id === agentId);
    if (agent && score < 50) {
      agent.log(`Temporarily shunned due to low trust score`);
    }
  }
}