/**
 * Simulation for floating solar + AI data hub use case with orchestrator.
 */
import { Agent } from '../src/Agent.js';
import { Orchestrator } from '../src/Orchestrator.js';

export async function runSimulation() {
  console.log('Starting floating solar simulation...');
  const agents = [
    new Agent('PropelAI', 'ProposalAgent', 5, 100, 70),
    new Agent('GuardBot', 'RiskAgent', 5, 100, 70),
    new Agent('FundFlow', 'GrantAgent', 5, 100, 70)
  ];
  const orchestrator = new Orchestrator(agents, ['community', 'experts', 'funders'], process.env.OPENAI_API_KEY || 'mock-key');

  const task = 'Plan floating solar experiment, assess risks, verify milestones, draft grant proposal, and propose norm update.';
  const input = {
    blueprint: {
      description: 'New polymer for solar panels',
      metrics: { financial: 6, ecological: 90, social: 75 },
      isHighRisk: true
    },
    experimentId: 1,
    sensorData: { emissions: 79, jobs: 65 },
    project: 'Floating Solar Project',
    metricsAlignment: { financial: 6, ecological: 90, social: 75 },
    normUpdate: {
      newMetric: { ecological: 95 },
      description: 'Lower ecological threshold to 95 for more experimentation'
    }
  };

  const result = await orchestrator.runTask(task, input);
  console.log('Simulation result:', result);
}

if (import.meta.url === new URL(import.meta.url).toString()) {
  runSimulation();
}