/**
 * Main React application for Cuttlefish Labs agent simulator.
 */
import React, { useState, useEffect } from 'react';
import { Agent, Metrics, Experiment } from './Agent';
import { Orchestrator } from './Orchestrator';
import AgentCard from './AgentCard';
import { SwarmBus, SwarmCoordinator, LLMCandidateGenerator } from './index';
import ExperimentForm from './ExperimentForm';
import ProposalForm from './ProposalForm';

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [orchestrator, setOrchestrator] = useState<Orchestrator | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [swarm, setSwarm] = useState<SwarmCoordinator | null>(null);

  useEffect(() => {
    const proposalAgent = new Agent('PropelAI', 'ProposalAgent', 5, 100, 70);
    const riskAgent = new Agent('GuardBot', 'RiskAgent', 5, 100, 70);
    const grantAgent = new Agent('FundFlow', 'GrantAgent', 5, 100, 70);
    const agents = [proposalAgent, riskAgent, grantAgent];

    const originalLog = Agent.prototype.log;
    Agent.prototype.log = function (message: string) {
      originalLog.call(this, message);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}][${this.id}][${this.role}] ${message}`].slice(-100));
    };

    const orch = new Orchestrator(agents, ['community', 'experts', 'funders'], process.env.OPENAI_API_KEY || 'mock-key');
    const bus = new SwarmBus();
    const coordinator = new SwarmCoordinator(bus, agents);
    // Optional: set LLM generator if OPENAI_API_KEY is present
    if (process.env.OPENAI_API_KEY) {
      const callLLM = async (prompt: string) => {
        // placeholder: rely on backend proxy or replace with your own call
        // return a JSON string array as described in LLMCandidateGenerator
        return JSON.stringify([
          { description: 'LLM: Microgrid v1', metrics: { financial: 65, ecological: 78, social: 73 }, isHighRisk: false },
          { description: 'LLM: Microgrid v2', metrics: { financial: 70, ecological: 72, social: 70 }, isHighRisk: false },
          { description: 'LLM: Microgrid v3', metrics: { financial: 55, ecological: 85, social: 80 }, isHighRisk: true }
        ]);
      };
      coordinator.setCandidateGenerator(new LLMCandidateGenerator(callLLM));
    }
    coordinator.setWeights({ financial: 1.2, ecological: 1.0, social: 1.1, riskPenalty: 120 });
    coordinator.wireHandlers();
    setAgents(agents);
    setOrchestrator(orch);
    setSwarm(coordinator);

    return () => {
      Agent.prototype.log = originalLog;
    };
  }, []);

  const updateAgentState = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => (agent.id === updatedAgent.id ? updatedAgent : agent)));
  };

  const handleProposeExperiment = async (description: string, projectedMetrics: Metrics, isHighRisk: boolean) => {
    if (!orchestrator) return;
    const input = { blueprint: { description, metrics: projectedMetrics, isHighRisk } };
    await orchestrator.runTask('Propose experiment', input);
    updateAgentState(agents.find(a => a.role === 'ProposalAgent')!);
  };

  const handleAttestExperiment = async (agentId: string, experimentId: number, actualMetrics: Metrics, sensorData: any) => {
    if (!orchestrator) return;
    const experiment = agents.find(a => a.id === agentId)?.experiments.find(e => e.id === experimentId);
    if (!experiment) return;
    const input = { experiment: { ...experiment, ownerId: agentId }, sensorData };
    await orchestrator.runTask('Assess and verify experiment', input);
    updateAgentState(agents.find(a => a.id === agentId)!);
  };

  const handleRemediateExperiment = async (agentId: string, experimentId: number, newMetrics: Metrics) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      const agentCopy = Object.assign(Object.create(Object.getPrototypeOf(agent)), agent);
      try {
        agentCopy.remediate(experimentId, newMetrics);
        updateAgentState(agentCopy);
      } catch (error: any) {
        agentCopy.log(`Failed to remediate experiment ${experimentId}: ${error.message}`);
        updateAgentState(agentCopy);
      }
    }
  };

  const handleDraftProposal = async (project: string, metricsAlignment: Metrics) => {
    if (!orchestrator) return;
    const input = { project, metricsAlignment };
    await orchestrator.runTask('Draft grant proposal', input);
    updateAgentState(agents.find(a => a.role === 'GrantAgent')!);
  };

  const handleNormUpdate = async (newMetric: Partial<Metrics>, description: string) => {
    if (!orchestrator) return;
    const input = { newMetric, description };
    await orchestrator.runTask('Propose norm update', input);
    setAgents([...agents]);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Cuttlefish Labs Agent Simulator</h1>
      <ExperimentForm onPropose={handleProposeExperiment} />
      <ProposalForm onDraft={handleDraftProposal} onNormUpdate={handleNormUpdate} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <h2 style={{ color: '#333' }}>Agent Dashboard</h2>
        <button
          onClick={async () => {
            if (!swarm) return;
            await swarm.runRound({
              description: 'Demo microgrid blueprint',
              metrics: { financial: 60, ecological: 80, social: 75 },
              isHighRisk: false
            });
          }}
          style={{ padding: '8px 12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Run Swarm Round
        </button>
        <button
          onClick={async () => {
            if (!swarm) return;
            await swarm.runRound({
              description: 'High-risk retrofit of legacy grid',
              metrics: { financial: 55, ecological: 65, social: 60 },
              isHighRisk: true
            });
          }}
          style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' }}
        >
          Run High-Risk Round
        </button>
        <button
          onClick={async () => {
            if (!swarm) return;
            const best = await swarm.runDaydream('Microgrid daydream', 4);
            console.log('Best daydream:', best);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}][Daydream] Best: ${best?.experiment?.description} (score: ${best?.score?.toFixed?.(2)})`].slice(-100));
          }}
          style={{ padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' }}
        >
          Daydream (4 iters)
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onAttest={handleAttestExperiment}
            onRemediate={handleRemediateExperiment}
          />
        ))}
      </div>
      <h2 style={{ textAlign: 'center', marginTop: '40px', color: '#333' }}>Global Activity Log</h2>
      <div style={{ border: '1px solid #ddd', padding: '15px', maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '8px' }}>
        {logs.map((log, index) => (
          <p key={index} style={{ margin: '5px 0', fontSize: '0.9em', color: '#555' }}>{log}</p>
        ))}
      </div>
    </div>
  );
}

export default App;