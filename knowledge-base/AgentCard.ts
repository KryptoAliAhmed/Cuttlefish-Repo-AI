/**
 * React component to display an agent's state and actions.
 */
import React, { useState } from 'react';
import { Agent, Metrics } from './Agent.js';

interface AgentCardProps {
  agent: Agent;
  onAttest: (agentId: string, experimentId: number, actualMetrics: Metrics, sensorData: any) => void;
  onRemediate: (agentId: string, experimentId: number, newMetrics: Metrics) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onAttest, onRemediate }) => {
  const [attestExpId, setAttestExpId] = useState<number | ''>('');
  const [attestFinancial, setAttestFinancial] = useState<number>(0);
  const [attestEcological, setAttestEcological] = useState<number>(0);
  const [attestSocial, setAttestSocial] = useState<number>(0);
  const [remediateExpId, setRemediateExpId] = useState<number | ''>('');
  const [remediateFinancial, setRemediateFinancial] = useState<number>(0);
  const [remediateEcological, setRemediateEcological] = useState<number>(0);
  const [remediateSocial, setRemediateSocial] = useState<number>(0);

  const handleAttest = () => {
    if (attestExpId === '') return;
    onAttest(agent.id, attestExpId as number, {
      financial: attestFinancial,
      ecological: attestEcological,
      social: attestSocial
    }, { emissions: attestEcological, jobs: attestSocial });
    setAttestExpId('');
    setAttestFinancial(0);
    setAttestEcological(0);
    setAttestSocial(0);
  };

  const handleRemediate = () => {
    if (remediateExpId === '') return;
    onRemediate(agent.id, remediateExpId as number, {
      financial: remediateFinancial,
      ecological: remediateEcological,
      social: remediateSocial
    });
    setRemediateExpId('');
    setRemediateFinancial(0);
    setRemediateEcological(0);
    setRemediateSocial(0);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)', backgroundColor: '#f9f9f9' }}>
      <h3>{agent.id} ({agent.role})</h3>
      <p><strong>Reputation:</strong> {agent.reputation.toFixed(2)}</p>
      <p><strong>Escrow Locked:</strong> {agent.escrowLocked.toFixed(2)}</p>
      <p><strong>Goals:</strong> F:{agent.goals.financial}, E:{agent.goals.ecological}, S:{agent.goals.social}</p>
      <p><strong>Current Metrics:</strong> F:{agent.currentMetrics.financial.toFixed(2)}, E:{agent.currentMetrics.ecological.toFixed(2)}, S:{agent.currentMetrics.social.toFixed(2)}</p>
      <h4>Experiments:</h4>
      {agent.experiments.length === 0 ? (
        <p>No experiments proposed yet.</p>
      ) : (
        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px dashed #eee', padding: '5px' }}>
          {agent.experiments.map(exp => (
            <div key={exp.id} style={{ marginBottom: '8px', padding: '5px', borderBottom: '1px solid #eee' }}>
              <strong>ID: {exp.id}</strong> - {exp.description} ({exp.riskBand})<br />
              Projected: F:{exp.projectedMetrics.financial}, E:{exp.projectedMetrics.ecological}, S:{exp.projectedMetrics.social}<br />
              Actual: {exp.actualMetrics ? `F:${exp.actualMetrics.financial}, E:${exp.actualMetrics.ecological}, S:${exp.actualMetrics.social}` : 'N/A'}<br />
              Verified: {exp.verified ? 'Yes' : 'No'}
            </div>
          ))}
        </div>
      )}
      {agent.role !== 'ProposalAgent' && (
        <>
          <h4>Submit Attestation:</h4>
          <div>
            <label>Experiment ID: </label>
            <input type="number" value={attestExpId} onChange={e => setAttestExpId(Number(e.target.value))} />
            <label>Financial: </label>
            <input type="number" value={attestFinancial} onChange={e => setAttestFinancial(Number(e.target.value))} />
            <label>Ecological: </label>
            <input type="number" value={attestEcological} onChange={e => setAttestEcological(Number(e.target.value))} />
            <label>Social: </label>
            <input type="number" value={attestSocial} onChange={e => setAttestSocial(Number(e.target.value))} />
            <button onClick={handleAttest} style={{ marginTop: '10px' }}>Submit Attestation</button>
          </div>
          <h4>Remediate Experiment:</h4>
          <div>
            <label>Experiment ID: </label>
            <input type="number" value={remediateExpId} onChange={e => setRemediateExpId(Number(e.target.value))} />
            <label>Financial: </label>
            <input type="number" value={remediateFinancial} onChange={e => setRemediateFinancial(Number(e.target.value))} />
            <label>Ecological: </label>
            <input type="number" value={remediateEcological} onChange={e => setRemediateEcological(Number(e.target.value))} />
            <label>Social: </label>
            <input type="number" value={remediateSocial} onChange={e => setRemediateSocial(Number(e.target.value))} />
            <button onClick={handleRemediate} style={{ marginTop: '10px' }}>Remediate</button>
          </div>
        </>
      )}
      <h4>Logs:</h4>
      <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #eee', padding: '5px', backgroundColor: '#f0f0f0', fontSize: '0.8em' }}>
        {agent.logMessages.map((log, index) => (
          <p key={index} style={{ margin: '2px 0' }}>{log}</p>
        ))}
      </div>
    </div>
  );
};

export default AgentCard;