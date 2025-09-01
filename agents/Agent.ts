/**
 * Agent class for Cuttlefish Labs builder agents with role-based ethical kernels.
 */
import { simpleHash } from './utils.js';

export type Metrics = { financial: number; ecological: number; social: number };
export type AgentRole = 'ProposalAgent' | 'RiskAgent' | 'GrantAgent';

export interface Experiment {
  id: number;
  description: string;
  projectedMetrics: Metrics;
  actualMetrics: Metrics | null;
  verified: boolean;
  riskBand: 'high' | 'normal';
  auditCommitted: boolean;
}

export class Agent {
  id: string;
  role: AgentRole;
  reputation: number;
  metrics: Metrics;
  goals: Metrics;
  currentMetrics: Metrics;
  experiments: any[];
  attestations: any[];
  escrowLocked: number;
  logMessages: string[];

  constructor(id: string, role: AgentRole, financialGoal: number, ecologicalGoal: number, socialGoal: number) {
    this.id = id;
    this.role = role;
    this.reputation = 100;
    this.metrics = { financial: financialGoal, ecological: ecologicalGoal, social: socialGoal };
    this.goals = { financial: financialGoal, ecological: ecologicalGoal, social: socialGoal };
    this.currentMetrics = { financial: 0, ecological: 0, social: 0 };
    this.experiments = [];
    this.attestations = [];
    this.escrowLocked = 0;
    this.logMessages = [];
  }

  /**
   * Propose an experiment with risk band declaration.
   */
  proposeExperiment(description: string, projectedMetrics: Metrics, isHighRisk: boolean = false) {
    if (!projectedMetrics.financial || !projectedMetrics.ecological || !projectedMetrics.social) {
      throw new Error('Invalid projected metrics');
    }
    const experiment = {
      id: this.experiments.length + 1,
      description,
      projectedMetrics,
      actualMetrics: null,
      verified: false,
      riskBand: isHighRisk ? 'high' : 'normal',
      auditCommitted: isHighRisk
    };
    this.experiments.push(experiment);
    this.log(`${this.id} (${this.role}) proposed ${isHighRisk ? 'high-risk' : 'normal'} experiment: ${description}`);
    return experiment;
  }

  /**
   * Submit attestation for an experiment.
   */
  submitAttestation(experimentId: number, actualMetrics: Metrics) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) throw new Error('Experiment not found');
    experiment.actualMetrics = actualMetrics;
    const attestation = {
      experimentId,
      metrics: actualMetrics,
      hash: simpleHash(JSON.stringify(actualMetrics)),
      timestamp: Date.now()
    };
    this.attestations.push(attestation);
    this.log(`${this.id} (${this.role}) submitted attestation for experiment ${experimentId}`);
    return attestation;
  }

  /**
   * Remediate a failed experiment.
   */
  remediate(experimentId: number, newMetrics: Metrics) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) throw new Error('Experiment not found');
    experiment.actualMetrics = newMetrics;
    this.attestations.push({
      experimentId,
      metrics: newMetrics,
      hash: simpleHash(JSON.stringify(newMetrics)),
      timestamp: Date.now()
    });
    this.escrowLocked = Math.max(0, this.escrowLocked - 10);
    this.log(`${this.id} (${this.role}) remediated experiment ${experimentId}, escrow reduced to ${this.escrowLocked}`);
    return experiment;
  }

  /**
   * Execute role-specific task.
   */
  async executeTask(task: string, input: any): Promise<any> {
    switch (this.role) {
      case 'ProposalAgent':
        return this.handleProposalTask(task, input);
      case 'RiskAgent':
        return this.handleRiskTask(task, input);
      case 'GrantAgent':
        return this.handleGrantTask(task, input);
      default:
        throw new Error('Unknown role');
    }
  }

  private async handleProposalTask(task: string, input: any) {
    // Parse JSON blueprint for infrastructure planning
    const { description, metrics } = input.blueprint || {};
    if (!description || !metrics) throw new Error('Invalid blueprint');
    return this.proposeExperiment(description, metrics, input.isHighRisk || false);
  }

  private async handleRiskTask(task: string, input: any) {
    // Simulate risk assessment
    const { experiment } = input;
    if (!experiment) throw new Error('Invalid experiment');
    return { riskScore: experiment.riskBand === 'high' ? 0.8 : 0.3 };
  }

  private async handleGrantTask(task: string, input: any) {
    // Simulate grant proposal drafting
    return { proposal: `Grant proposal for ${input.project} aligned with GCF requirements.` };
  }

  /**
   * Log messages to console and UI.
   */
  log(message: string) {
    const logMessage = `[${this.id}][${this.role}] ${message}`;
    console.log(logMessage);
    this.logMessages.push(logMessage);
    if (typeof document !== 'undefined') {
      const output = document.getElementById('output');
      if (output) output.innerHTML += `<p>${logMessage}</p>`;
    }
  }
}