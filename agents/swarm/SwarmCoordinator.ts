import { Agent } from '../Agent';
import { SwarmBus } from './SwarmBus';
import { SwarmMessage, createMessageId, SwarmResult } from './SwarmTypes';
import { TrustGraph } from '../TrustGraph';
import { CandidateGenerator, RandomCandidateGenerator, Blueprint as GenBlueprint } from './CandidateGenerator';

type Blueprint = { description: string; metrics: any; isHighRisk?: boolean };

export class SwarmCoordinator {
  private bus: SwarmBus;
  private agents: Agent[];
  private trust: TrustGraph;
  private generator: CandidateGenerator;
  private weights = { financial: 1, ecological: 1, social: 1, riskPenalty: 100, esgBonus: 10, esgPenalty: -10 };
  private observers: Array<(e: any) => void> = [];

  constructor(bus: SwarmBus, agents: Agent[]) {
    this.bus = bus;
    this.agents = agents;
    this.trust = new TrustGraph(agents);
    this.generator = new RandomCandidateGenerator();
  }

  wireHandlers() {
    // Proposal → emits experiment for RiskAgent
    this.bus.subscribe('ProposalAgent', async (msg): Promise<SwarmResult> => {
      if (msg.type !== 'propose') return { ok: true };
      const proposalAgent = this.agents.find(a => a.role === 'ProposalAgent');
      if (!proposalAgent) return { ok: false, error: 'No ProposalAgent' };
      const { blueprint } = msg.payload as { blueprint: Blueprint };
      const experiment = await proposalAgent.executeTask('propose', { blueprint, isHighRisk: !!blueprint.isHighRisk });
      const forward: SwarmMessage = {
        id: createMessageId(),
        type: 'assessRisk',
        from: 'ProposalAgent',
        to: 'RiskAgent',
        payload: { experiment, sensorData: msg.payload?.sensorData },
        createdAt: Date.now()
      };
      await this.bus.publish(forward);
      return { ok: true, data: experiment };
    });

    // Risk → emits grant drafting request for GrantAgent
    this.bus.subscribe('RiskAgent', async (msg): Promise<SwarmResult> => {
      if (msg.type !== 'assessRisk') return { ok: true };
      const riskAgent = this.agents.find(a => a.role === 'RiskAgent');
      if (!riskAgent) return { ok: false, error: 'No RiskAgent' };
      const { experiment, sensorData } = msg.payload as { experiment: any; sensorData: any };
      const assessment = await riskAgent.executeTask('assessRisk', { experiment, sensorData });
      try {
        const owner = this.agents.find(a => a.id === (experiment?.ownerId || this.agents[0].id));
        if (owner) this.trust.evaluateExperiment(owner, experiment, sensorData);
      } catch (_) {}
      const forward: SwarmMessage = {
        id: createMessageId(),
        type: 'draftGrant',
        from: 'RiskAgent',
        to: 'GrantAgent',
        payload: { project: experiment?.description || 'Infrastructure Project', metricsAlignment: experiment?.projectedMetrics },
        createdAt: Date.now()
      };
      await this.bus.publish(forward);
      return { ok: true, data: assessment };
    });

    // ESG step (optional): perform ecological/social checks and annotate payload
    this.bus.subscribe('ESGAgent', async (msg): Promise<SwarmResult> => {
      if (msg.type !== 'assessRisk') return { ok: true };
      const { experiment } = msg.payload as { experiment: any };
      const pass = (experiment?.projectedMetrics?.ecological ?? 0) >= 60 && (experiment?.projectedMetrics?.social ?? 0) >= 60;
      return { ok: pass, data: { esgPass: pass } };
    });

    // Grant
    this.bus.subscribe('GrantAgent', async (msg): Promise<SwarmResult> => {
      if (msg.type !== 'draftGrant') return { ok: true };
      const grantAgent = this.agents.find(a => a.role === 'GrantAgent');
      if (!grantAgent) return { ok: false, error: 'No GrantAgent' };
      const { project, metricsAlignment } = msg.payload as { project: string; metricsAlignment: any };
      const proposal = await grantAgent.executeTask('draftProposal', { project, metricsAlignment });
      // Resolution: simplistic go/no-go based on financial alignment
      const go = (metricsAlignment?.financial ?? 0) >= 50;
      if (go) {
        const exec: SwarmMessage = {
          id: createMessageId(),
          type: 'executePlan',
          from: 'ResolutionAgent',
          to: 'BuilderAgent',
          payload: { plan: proposal, project },
          createdAt: Date.now()
        };
        await this.bus.publish(exec);
      }
      return { ok: true, data: { proposal, go } };
    });
  }

  async runRound(blueprint: Blueprint, sensorData?: any) {
    const root: SwarmMessage = {
      id: createMessageId(),
      type: 'propose',
      from: 'system',
      to: 'ProposalAgent',
      payload: { blueprint, sensorData },
      createdAt: Date.now()
    };
    await this.bus.publish(root);
  }

  /**
   * Daydream loop: simulate multiple hypothetical proposals and assessments, choose best.
   */
  async runDaydream(topic: string, iterations: number = 3) {
    const proposalAgent = this.agents.find(a => a.role === 'ProposalAgent');
    const riskAgent = this.agents.find(a => a.role === 'RiskAgent');
    if (!proposalAgent || !riskAgent) return null;

    let best: { score: number; experiment: any } | null = null;

    const candidates: GenBlueprint[] = await this.generator.generate(topic, Math.max(1, iterations));
    for (let i = 0; i < candidates.length; i++) {
      const candidate: Blueprint = candidates[i];

      await this.bus.publish({ id: createMessageId(), type: 'daydream.propose', from: 'system', payload: { candidate }, createdAt: Date.now() });
      const experiment = await proposalAgent.executeTask('propose', { blueprint: candidate, isHighRisk: candidate.isHighRisk });

      await this.bus.publish({ id: createMessageId(), type: 'daydream.assess', from: 'system', payload: { experiment }, createdAt: Date.now() });
      const assessment = await riskAgent.executeTask('assessRisk', { experiment, sensorData: null });

      // Simple ESG check inline (optional)
      const esgPass = (experiment?.projectedMetrics?.ecological ?? 0) >= 60 && (experiment?.projectedMetrics?.social ?? 0) >= 60;

      // Score: higher metrics and lower riskScore is better
      const m = experiment?.projectedMetrics || { financial: 0, ecological: 0, social: 0 };
      const score = (
        m.financial * this.weights.financial +
        m.ecological * this.weights.ecological +
        m.social * this.weights.social
      ) / (this.weights.financial + this.weights.ecological + this.weights.social)
      - (assessment?.riskScore ?? 0) * this.weights.riskPenalty
      + (esgPass ? this.weights.esgBonus : this.weights.esgPenalty);

      await this.bus.publish({ id: createMessageId(), type: 'daydream.iteration', from: 'system', payload: { experiment, assessment, esgPass, score }, createdAt: Date.now() });

      if (!best || score > best.score) {
        best = { score, experiment };
      }
    }

    if (best) {
      await this.bus.publish({ id: createMessageId(), type: 'daydream.result', from: 'system', payload: { best }, createdAt: Date.now() });
    }

    return best;
  }

  setWeights(weights: Partial<typeof this.weights>) {
    this.weights = { ...this.weights, ...weights };
  }

  setCandidateGenerator(generator: CandidateGenerator) {
    this.generator = generator;
  }

  onObservation(fn: (e: any) => void) {
    this.observers.push(fn);
  }
}


