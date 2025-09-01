/**
 * Agent class for Cuttlefish Labs builder agents with role-based ethical kernels.
 */
import { simpleHash, parseBlueprint } from './utils.js';

// Custom error classes
export class ExperimentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExperimentNotFoundError';
  }
}

export class InvalidBlueprintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBlueprintError';
  }
}

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
  goals: Metrics;
  currentMetrics: Metrics;
  experiments: Experiment[];
  attestations: any[];
  escrowLocked: number;
  logMessages: string[];

  constructor(id: string, role: AgentRole, financialGoal: number, ecologicalGoal: number, socialGoal: number) {
    this.id = id;
    this.role = role;
    this.reputation = 100;
    this.goals = { financial: financialGoal, ecological: ecologicalGoal, social: socialGoal };
    this.currentMetrics = { financial: 0, ecological: 0, social: 0 };
    this.experiments = [];
    this.attestations = [];
    this.escrowLocked = 0;
    this.logMessages = [];
  }

  proposeExperiment(description: string, projectedMetrics: Metrics, isHighRisk: boolean = false): Experiment {
    if (!projectedMetrics.financial || !projectedMetrics.ecological || !projectedMetrics.social) {
      throw new InvalidBlueprintError('Projected metrics must be non-zero');
    }
    const experiment: Experiment = {
      id: this.experiments.length + 1,
      description,
      projectedMetrics,
      actualMetrics: null,
      verified: false,
      riskBand: isHighRisk ? 'high' : 'normal',
      auditCommitted: isHighRisk
    };
    this.experiments.push(experiment);
    if (isHighRisk) {
      this.escrowLocked += 20;
      this.log(`Locked 20 escrow for high-risk experiment ${experiment.id}`);
    }
    this.log(`Proposed ${isHighRisk ? 'high-risk' : 'normal'} experiment: ${description}`);
    return experiment;
  }

  submitAttestation(experimentId: number, actualMetrics: Metrics) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) {
      this.log(`ERROR: Experiment ${experimentId} not found`);
      throw new ExperimentNotFoundError(`Experiment ${experimentId} not found`);
    }
    experiment.actualMetrics = actualMetrics;
    const attestation = {
      experimentId,
      metrics: actualMetrics,
      hash: simpleHash(JSON.stringify(actualMetrics)),
      timestamp: Date.now()
    };
    this.attestations.push(attestation);

    let reputationChange = 0;
    let success = true;
    if (actualMetrics.financial >= this.goals.financial) {
      reputationChange += 5;
      this.currentMetrics.financial += actualMetrics.financial;
    } else {
      reputationChange -= 10;
      success = false;
    }
    if (actualMetrics.ecological >= this.goals.ecological * 0.8) {
      reputationChange += 5;
      this.currentMetrics.ecological += actualMetrics.ecological;
    } else {
      reputationChange -= 12;
      success = false;
    }
    if (actualMetrics.social >= this.goals.social * 0.9) {
      reputationChange += 5;
      this.currentMetrics.social += actualMetrics.social;
    } else {
      reputationChange -= 8;
      success = false;
    }
    if (experiment.riskBand === 'high' && !success) {
      reputationChange -= 15;
      this.escrowLocked += 30;
      this.log(`High-risk experiment ${experimentId} failed, additional 30 escrow locked`);
    } else if (success) {
      this.escrowLocked = Math.max(0, this.escrowLocked - 10);
    }
    this.reputation = Math.max(0, Math.min(100, this.reputation + reputationChange));
    this.log(`Submitted attestation for experiment ${experimentId}. Reputation: ${this.reputation} (Change: ${reputationChange})`);
    return attestation;
  }

  remediate(experimentId: number, newMetrics: Metrics) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) {
      this.log(`ERROR: Experiment ${experimentId} not found`);
      throw new ExperimentNotFoundError(`Experiment ${experimentId} not found`);
    }
    const oldMetrics = experiment.actualMetrics || { financial: 0, ecological: 0, social: 0 };
    experiment.actualMetrics = newMetrics;
    this.attestations.push({
      experimentId,
      metrics: newMetrics,
      hash: simpleHash(JSON.stringify(newMetrics)),
      timestamp: Date.now()
    });
    this.escrowLocked = Math.max(0, this.escrowLocked - 25);
    this.reputation = Math.min(100, this.reputation + 10);
    this.currentMetrics.financial += newMetrics.financial - oldMetrics.financial;
    this.currentMetrics.ecological += newMetrics.ecological - oldMetrics.ecological;
    this.currentMetrics.social += newMetrics.social - oldMetrics.social;
    this.log(`Remediated experiment ${experimentId}. Escrow: ${this.escrowLocked}, Reputation: ${this.reputation}`);
    return experiment;
  }

  verifyExperiment(experimentId: number, sensorData: any) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) {
      this.log(`ERROR: Experiment ${experimentId} not found`);
      throw new ExperimentNotFoundError(`Experiment ${experimentId} not found`);
    }
    const latestAttestation = this.attestations.filter(a => a.experimentId === experimentId).pop();
    if (!latestAttestation) {
      this.log(`ERROR: No attestation for experiment ${experimentId}`);
      return false;
    }
    const isValid = simpleHash(JSON.stringify(sensorData)) === latestAttestation.hash;
    if (isValid) {
      experiment.verified = true;
      this.reputation = Math.min(100, this.reputation + 5);
      this.log(`Experiment ${experimentId} verified`);
    } else {
      this.reputation = Math.max(0, this.reputation - 10);
      this.log(`Experiment ${experimentId} failed verification`);
    }
    return isValid;
  }

  async executeTask(task: string, input: any): Promise<any> {
    switch (this.role) {
      case 'ProposalAgent':
        return this.handleProposalTask(task, input);
      case 'RiskAgent':
        return this.handleRiskTask(task, input);
      case 'GrantAgent':
        return this.handleGrantTask(task, input);
      default:
        throw new Error(`Unknown role: ${this.role}`);
    }
  }

  private handleProposalTask(task: string, input: any) {
    if (task !== 'propose') throw new Error(`Invalid task for ProposalAgent: ${task}`);
    const blueprint = parseBlueprint(JSON.stringify(input.blueprint));
    if (!blueprint.description || !blueprint.metrics) {
      this.log('ERROR: Invalid blueprint');
      throw new InvalidBlueprintError('Blueprint missing description or metrics');
    }
    return this.proposeExperiment(blueprint.description, blueprint.metrics, blueprint.isHighRisk || false);
  }

  private handleRiskTask(task: string, input: any) {
    if (task !== 'assessRisk') throw new Error(`Invalid task for RiskAgent: ${task}`);
    const { experiment, sensorData } = input;
    if (!experiment) {
      this.log('ERROR: Invalid experiment');
      throw new InvalidBlueprintError('Invalid experiment');
    }
    const riskScore = experiment.riskBand === 'high' ? 0.8 : 0.3;
    const isVerified = this.verifyExperiment(experiment.id, sensorData);
    this.log(`Assessed risk for experiment ${experiment.id}: ${riskScore}, Verified: ${isVerified}`);
    return { riskScore, verified: isVerified };
  }

  private handleGrantTask(task: string, input: any) {
    if (task !== 'draftProposal') throw new Error(`Invalid task for GrantAgent: ${task}`);
    const { project, metricsAlignment } = input;
    if (!project || !metricsAlignment) {
      this.log('ERROR: Invalid grant input');
      throw new InvalidBlueprintError('Invalid grant input');
    }
    const proposal = `Grant proposal for ${project} aligned with GCF requirements. Metrics: ${JSON.stringify(metricsAlignment)}`;
    this.log(`Drafted grant proposal for ${project}`);
    return { proposal };
  }

  log(message: string) {
    const logEntry = `[${new Date().toLocaleTimeString()}][${this.id}][${this.role}] ${message}`;
    console.log(logEntry);
    this.logMessages.push(logEntry);
    if (this.logMessages.length > 50) this.logMessages.shift();
  }
}