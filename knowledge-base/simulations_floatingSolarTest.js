/**
 * Simulation for floating solar + AI data hub use case.
 */
import { Agent } from '../src/Agent.js';
import { TrustGraph } from '../src/TrustGraph.js';
import { DAO } from '../src/DAO.js';
import { simpleHash } from '../src/utils.js';

// Run simulation
export function runSimulation() {
  console.log('Starting floating solar simulation...');
  const agents = [
    new Agent('Agent_X', { financial: 5, ecological: 100, social: 70 }),
    new Agent('Agent_Y', { financial: 5, ecological: 100, social: 70 }),
    new Agent('Agent_Z', { financial: 5, ecological: 100, social: 70 })
  ];

  const trustGraph = new TrustGraph(agents);
  const dao = new DAO(agents, ['community', 'experts', 'funders']);

  // Agent X proposes high-risk polymer experiment
  const experiment = agents[0].proposeExperiment(
    'New polymer for solar panels',
    { financial: 6, ecological: 90, social: 75 },
    true
  );

  // Submit attestation
  agents[0].submitAttestation(experiment.id, {
    financial: 6,
    ecological: 79, // Below 80% threshold
    social: 65 // Below 90% threshold
  }, simpleHash);

  // Peers evaluate
  const sensorData = { emissions: 79, jobs: 65 };
  agents.slice(1).forEach(peer => {
    trustGraph.evaluateExperiment(agents[0], experiment, sensorData, simpleHash);
  });

  // Remediate
  agents[0].remediate(experiment.id, { financial: 6, ecological: 95, social: 70 }, simpleHash);
}

// Propose norm update
export function proposeNormUpdate() {
  console.log('Starting norm update simulation...');
  const agents = [
    new Agent('Agent_X', { financial: 5, ecological: 100, social: 70 }),
    new Agent('Agent_Y', { financial: 5, ecological: 100, social: 70 }),
    new Agent('Agent_Z', { financial: 5, ecological: 100, social: 70 })
  ];
  const dao = new DAO(agents, ['community', 'experts', 'funders']);
  const proposal = dao.proposeNormUpdate(
    'Agent_X',
    { ecological: 95 },
    'Lower ecological threshold to 95 for more experimentation'
  );
  dao.voteOnProposal(proposal.id, 'community', true);
  dao.voteOnProposal(proposal.id, 'experts', false);
  dao.voteOnProposal(proposal.id, 'funders', true);
}

// Run if executed directly
if (typeof process !== 'undefined' && process.argv[1] === import.meta.url.replace('file://', '')) {
  runSimulation();
  proposeNormUpdate();
}