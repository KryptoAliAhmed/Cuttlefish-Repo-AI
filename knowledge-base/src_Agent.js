/**
 * Agent class for Cuttlefish Labs builder agents with ethical kernels.
 * @class
 */
export class Agent {
  constructor(id, financialGoal, ecologicalGoal, socialGoal) {
    this.id = id;
    this.reputation = 100; // Initial trust score (0-100)
    this.metrics = { financial: financialGoal, ecological: ecologicalGoal, social: socialGoal };
    this.experiments = [];
    this.attestations = [];
    this.escrowLocked = 0;
  }

  /**
   * Propose an experiment with risk band declaration.
   * @param {string} description - Experiment description
   * @param {Object} projectedMetrics - Projected financial, ecological, social metrics
   * @param {boolean} isHighRisk - High-risk experiment flag
   * @returns {Object} Experiment object
   */
  proposeExperiment(description, projectedMetrics, isHighRisk = false) {
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
    this.log(`${this.id} proposed ${isHighRisk ? 'high-risk' : 'normal'} experiment: ${description}`);
    return experiment;
  }

  /**
   * Submit attestation for an experiment.
   * @param {number} experimentId - Experiment ID
   * @param {Object} actualMetrics - Actual metrics achieved
   * @param {Function} hashFn - Hash function for ZKP simulation
   * @returns {Object} Attestation object
   */
  submitAttestation(experimentId, actualMetrics, hashFn) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) throw new Error('Experiment not found');
    experiment.actualMetrics = actualMetrics;
    const attestation = {
      experimentId,
      metrics: actualMetrics,
      hash: hashFn(JSON.stringify(actualMetrics)),
      timestamp: Date.now()
    };
    this.attestations.push(attestation);
    this.log(`${this.id} submitted attestation for experiment ${experimentId}`);
    return attestation;
  }

  /**
   * Remediate a failed experiment.
   * @param {number} experimentId - Experiment ID
   * @param {Object} newMetrics - Remediated metrics
   * @param {Function} hashFn - Hash function
   */
  remediate(experimentId, newMetrics, hashFn) {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) throw new Error('Experiment not found');
    experiment.actualMetrics = newMetrics;
    this.attestations.push({
      experimentId,
      metrics: newMetrics,
      hash: hashFn(JSON.stringify(newMetrics)),
      timestamp: Date.now()
    });
    this.escrowLocked = Math.max(0, this.escrowLocked - 10);
    this.log(`${this.id} remediated experiment ${experimentId}, escrow reduced to ${this.escrowLocked}`);
  }

  /**
   * Log messages to console and optional UI.
   * @param {string} message - Log message
   */
  log(message) {
    console.log(`[${this.id}] ${message}`);
    if (typeof document !== 'undefined') {
      const output = document.getElementById('output');
      if (output) output.innerHTML += `<p>[${this.id}] ${message}</p>`;
    }
  }
}