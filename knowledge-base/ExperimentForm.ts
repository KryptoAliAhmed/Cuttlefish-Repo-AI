/**
 * React component for proposing new experiments.
 */
import React, { useState } from 'react';
import { Metrics } from './Agent.js';

interface ExperimentFormProps {
  onPropose: (description: string, projectedMetrics: Metrics, isHighRisk: boolean) => void;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({ onPropose }) => {
  const [description, setDescription] = useState('');
  const [financial, setFinancial] = useState<number>(0);
  const [ecological, setEcological] = useState<number>(0);
  const [social, setSocial] = useState<number>(0);
  const [isHighRisk, setIsHighRisk] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || financial <= 0 || ecological <= 0 || social <= 0) {
      alert('Please fill all fields with valid non-zero metrics.');
      return;
    }
    onPropose(description, { financial, ecological, social }, isHighRisk);
    setDescription('');
    setFinancial(0);
    setEcological(0);
    setSocial(0);
    setIsHighRisk(false);
  };

  return (
    <div style={{ border: '1px solid #aaddaa', padding: '20px', margin: '20px', borderRadius: '10px', backgroundColor: '#eaffea' }}>
      <h2>Propose Experiment (ProposalAgent)</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Description: </label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>Projected Financial: </label>
          <input type="number" value={financial} onChange={e => setFinancial(Number(e.target.value))} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>Projected Ecological: </label>
          <input type="number" value={ecological} onChange={e => setEcological(Number(e.target.value))} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>Projected Social: </label>
          <input type="number" value={social} onChange={e => setSocial(Number(e.target.value))} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>
            <input type="checkbox" checked={isHighRisk} onChange={e => setIsHighRisk(e.target.checked)} />
            High Risk
          </label>
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' }}>Propose Experiment</button>
      </form>
    </div>
  );
};

export default ExperimentForm;