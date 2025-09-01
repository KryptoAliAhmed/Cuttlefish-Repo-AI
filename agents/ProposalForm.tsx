/**
 * React component for drafting grant proposals and norm updates.
 */
import React, { useState } from 'react';
import { Metrics } from './Agent';

interface ProposalFormProps {
  onDraft: (project: string, metricsAlignment: Metrics) => void;
  onNormUpdate: (newMetric: Partial<Metrics>, description: string) => void;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ onDraft, onNormUpdate }) => {
  const [project, setProject] = useState('');
  const [metricsFinancial, setMetricsFinancial] = useState<number>(0);
  const [metricsEcological, setMetricsEcological] = useState<number>(0);
  const [metricsSocial, setMetricsSocial] = useState<number>(0);
  const [normDescription, setNormDescription] = useState('');
  const [normFinancial, setNormFinancial] = useState<number>(0);
  const [normEcological, setNormEcological] = useState<number>(0);
  const [normSocial, setNormSocial] = useState<number>(0);

  const handleDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || metricsFinancial <= 0 || metricsEcological <= 0 || metricsSocial <= 0) {
      alert('Please fill all fields with valid non-zero metrics.');
      return;
    }
    onDraft(project, { financial: metricsFinancial, ecological: metricsEcological, social: metricsSocial });
    setProject('');
    setMetricsFinancial(0);
    setMetricsEcological(0);
    setMetricsSocial(0);
  };

  const handleNormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normDescription) {
      alert('Please provide a norm description.');
      return;
    }
    const newMetric: Partial<Metrics> = {};
    if (normFinancial > 0) newMetric.financial = normFinancial;
    if (normEcological > 0) newMetric.ecological = normEcological;
    if (normSocial > 0) newMetric.social = normSocial;
    if (Object.keys(newMetric).length === 0) {
      alert('Please provide at least one non-zero metric.');
      return;
    }
    onNormUpdate(newMetric, normDescription);
    setNormDescription('');
    setNormFinancial(0);
    setNormEcological(0);
    setNormSocial(0);
  };

  return (
    <div style={{ border: '1px solid #aaddaa', padding: '20px', margin: '20px', borderRadius: '10px', backgroundColor: '#eaffea' }}>
      <h2>Grant Proposal & Norm Update (GrantAgent & DAO)</h2>
      <h3>Draft Grant Proposal</h3>
      <form onSubmit={handleDraftSubmit}>
        <div>
          <label>Project: </label>
          <input type="text" value={project} onChange={e => setProject(e.target.value)} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>Metrics Financial: </label>
          <input type="number" value={metricsFinancial} onChange={e => setMetricsFinancial(Number(e.target.value))} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>Metrics Ecological: </label>
          <input type="number" value={metricsEcological} onChange={e => setMetricsEcological(Number(e.target.value))} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>Metrics Social: </label>
          <input type="number" value={metricsSocial} onChange={e => setMetricsSocial(Number(e.target.value))} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' }}>Draft Proposal</button>
      </form>
      <h3>Propose Norm Update</h3>
      <form onSubmit={handleNormSubmit}>
        <div>
          <label>Description: </label>
          <input type="text" value={normDescription} onChange={e => setNormDescription(e.target.value)} required style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>New Financial Goal: </label>
          <input type="number" value={normFinancial} onChange={e => setNormFinancial(Number(e.target.value))} style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>New Ecological Goal: </label>
          <input type="number" value={normEcological} onChange={e => setNormEcological(Number(e.target.value))} style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <div>
          <label>New Social Goal: </label>
          <input type="number" value={normSocial} onChange={e => setNormSocial(Number(e.target.value))} style={{ width: 'calc(100% - 100px)', padding: '8px', margin: '5px 0' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' }}>Propose Norm Update</button>
      </form>
    </div>
  );
};

export default ProposalForm;