import { TrustGraph } from './TrustGraph';
import { Agent, Metrics, Experiment } from './Agent';
import { DAOSettings } from './DAO';
import { ethers } from 'ethers';
import BuilderAgentWalletABI from './artifacts/BuilderAgentWallet.json';
import { simpleHash } from './utils';

jest.mock('ethers');
jest.mock('./utils', () => ({
  simpleHash: jest.fn().mockReturnValue('mocked_hash')
}));

describe('TrustGraph', () => {
  let trustGraph: TrustGraph;
  let agent: Agent;
  let daoSettings: DAOSettings;
  let provider: ethers.JsonRpcProvider;
  let contract: ethers.Contract;

  beforeEach(() => {
    jest.clearAllMocks();
    daoSettings = {
      name: 'AIClusterDAO-Azores',
      votingWeights: { community: 1.2, experts: 2.0, funders: 2.8 },
      escrowPolicy: { highRisk: 14, normalRisk: 5 },
      ethicalKernels: { financial: 55, ecological: 30, social: 15 }
    };
    provider = new ethers.JsonRpcProvider('http://localhost:8545');
    contract = new ethers.Contract('0xMOCK_CONTRACT_ADDRESS', BuilderAgentWalletABI.abi, provider);
    trustGraph = new TrustGraph(daoSettings, '0xMOCK_CONTRACT_ADDRESS', provider, BuilderAgentWalletABI.abi);
    agent = new Agent('agent1', 'BuilderAgent', { financial: 1000, ecological: 500, social: 300 }, undefined, 'AIClusterDAO-Azores');
    trustGraph.addAgent(agent);
    contract.verifyExperiment = jest.fn().mockResolvedValue({ hash: '0x123' });
    (simpleHash as jest.Mock).mockReturnValue('mocked_hash');
  });

  it('should initialize with correct DAO settings', () => {
    expect(trustGraph['daoSettings']).toEqual(daoSettings);
    expect(trustGraph['contractAddress']).toBe('0xMOCK_CONTRACT_ADDRESS');
  });

  it('should add agent with initial trust score', () => {
    expect(trustGraph.getTrustScore('agent1')).toBe(100); // Agent's initial reputation
  });

  it('should evaluate experiment with positive adjustment using DAO weights', async () => {
    const experiment: Experiment = {
      id: 1,
      description: 'Geothermal GPU Cluster',
      projectedMetrics: { financial: 1000, ecological: 500, social: 300 },
      actualMetrics: { financial: 1100, ecological: 600, social: 350 },
      verified: false,
      riskBand: 'normal',
      auditCommitted: false,
      ownerId: 'agent1',
      daoId: 'AIClusterDAO-Azores'
    };
    const sensorData = {
      genesys_metrics: { loss: 0.2, energy_efficiency_mj: 0.04, social_impact_score: 0.85, verified: true }
    };
    await trustGraph.evaluateExperiment(agent, experiment, sensorData, {
      targetMetrics: { financial: 1000, ecological: 500, social: 300 },
      daoId: 'AIClusterDAO-Azores'
    });
    const trustScore = trustGraph.getTrustScore('agent1');
    const expectedAdjustment = (10 * 0.55) + (8 * 0.30) + (6 * 0.15) + (5 * 0.55) + (4 * 0.30) + (3 * 0.15); // Weights from ethicalKernels
    expect(trustScore).toBeCloseTo(100 + expectedAdjustment, 2);
    expect(contract.verifyExperiment).toHaveBeenCalledWith(
      'AIClusterDAO-Azores',
      1,
      1100,
      600,
      350,
      true
    );
    expect(simpleHash).toHaveBeenCalledWith(JSON.stringify(experiment.actualMetrics));
  });

  it('should apply penalty for poor performance and high-risk escrow', async () => {
    const experiment: Experiment = {
      id: 2,
      description: 'Failed Experiment',
      projectedMetrics: { financial: 1000, ecological: 500, social: 300 },
      actualMetrics: { financial: 800, ecological: 300, social: 200 },
      verified: false,
      riskBand: 'high',
      auditCommitted: true,
      ownerId: 'agent1',
      daoId: 'AIClusterDAO-Azores'
    };
    const sensorData = { genesys_metrics: { verified: false } };
    await trustGraph.evaluateExperiment(agent, experiment, sensorData, {
      targetMetrics: { financial: 1000, ecological: 500, social: 300 },
      daoId: 'AIClusterDAO-Azores'
    });
    const trustScore = trustGraph.getTrustScore('agent1');
    const expectedAdjustment = (-5 * 0.55) + (-4 * 0.30) + (-3 * 0.15) - 5; // Penalties + unverified
    expect(trustScore).toBeCloseTo(100 + expectedAdjustment, 2);
    expect(agent.escrowLocked).toBe(14); // High-risk escrow policy
  });

  it('should handle contract call failures gracefully', async () => {
    contract.verifyExperiment.mockRejectedValue(new Error('Contract call failed'));
    const experiment: Experiment = {
      id: 3,
      description: 'Test Experiment',
      projectedMetrics: { financial: 1000, ecological: 500, social: 300 },
      actualMetrics: { financial: 1100, ecological: 600, social: 350 },
      verified: false,
      riskBand: 'normal',
      auditCommitted: false,
      ownerId: 'agent1',
      daoId: 'AIClusterDAO-Azores'
    };
    await expect(
      trustGraph.evaluateExperiment(agent, experiment, { genesys_metrics: { verified: true } }, {
        targetMetrics: { financial: 1000, ecological: 500, social: 300 },
        daoId: 'AIClusterDAO-Azores'
      })
    ).resolves.toBeUndefined();
    expect(trustGraph.getTrustScore('agent1')).toBeGreaterThan(100); // Evaluation still updates local trust
  });

  it('should throw error for invalid metrics', async () => {
    const experiment: Experiment = {
      id: 4,
      description: 'Invalid Experiment',
      projectedMetrics: { financial: 1000, ecological: 500, social: 300 },
      actualMetrics: null,
      verified: false,
      riskBand: 'normal',
      auditCommitted: false,
      ownerId: 'agent1',
      daoId: 'AIClusterDAO-Azores'
    };
    await expect(
      trustGraph.evaluateExperiment(agent, experiment, { genesys_metrics: { verified: true } }, {
        targetMetrics: { financial: 1000, ecological: 500, social: 300 },
        daoId: 'AIClusterDAO-Azores'
      })
    ).rejects.toThrow('Invalid metrics for evaluation');
  });
});