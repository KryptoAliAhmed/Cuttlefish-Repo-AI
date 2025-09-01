"use client"

/**
 * React component for drafting grant proposals and norm updates.
 */
import type React from "react"
import { useState } from "react"
import type { Metrics } from "../Agent.js"

interface ProposalFormProps {
  onDraft: (project: string, metricsAlignment: Metrics) => void
  onNormUpdate: (newMetric: Partial<Metrics>, description: string) => void
}

const ProposalForm: React.FC<ProposalFormProps> = ({ onDraft, onNormUpdate }) => {
  const [project, setProject] = useState("")
  const [metricsFinancial, setMetricsFinancial] = useState<number>(0)
  const [metricsEcological, setMetricsEcological] = useState<number>(0)
  const [metricsSocial, setMetricsSocial] = useState<number>(0)
  const [normDescription, setNormDescription] = useState("")
  const [normFinancial, setNormFinancial] = useState<number>(0)
  const [normEcological, setNormEcological] = useState<number>(0)
  const [normSocial, setNormSocial] = useState<number>(0)

  const handleDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || metricsFinancial <= 0 || metricsEcological <= 0 || metricsSocial <= 0) {
      alert("Please fill all fields with valid non-zero metrics.")
      return
    }
    onDraft(project, { financial: metricsFinancial, ecological: metricsEcological, social: metricsSocial })
    setProject("")
    setMetricsFinancial(0)
    setMetricsEcological(0)
    setMetricsSocial(0)
  }

  const handleNormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!normDescription) {
      alert("Please provide a norm description.")
      return
    }
    const newMetric: Partial<Metrics> = {}
    if (normFinancial > 0) newMetric.financial = normFinancial
    if (normEcological > 0) newMetric.ecological = normEcological
    if (normSocial > 0) newMetric.social = normSocial
    if (Object.keys(newMetric).length === 0) {
      alert("Please provide at least one non-zero metric.")
      return
    }
    onNormUpdate(newMetric, normDescription)
    setNormDescription("")
    setNormFinancial(0)
    setNormEcological(0)
    setNormSocial(0)
  }

  const formStyle: React.CSSProperties = {
    border: "1px solid #aaddff",
    padding: "20px",
    margin: "20px 0",
    borderRadius: "10px",
    backgroundColor: "#f0f8ff",
  }
  const inputStyle: React.CSSProperties = {
    width: "calc(100% - 140px)",
    padding: "8px",
    margin: "5px 0",
    display: "inline-block",
  }
  const labelStyle: React.CSSProperties = {
    width: "130px",
    display: "inline-block",
  }
  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "15px",
  }

  return (
    <div style={formStyle}>
      <h2>Grant & DAO Proposals</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>Draft Grant Proposal</h3>
          <form onSubmit={handleDraftSubmit}>
            <div>
              <label style={labelStyle}>Project: </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Metrics Financial: </label>
              <input
                type="number"
                value={metricsFinancial}
                onChange={(e) => setMetricsFinancial(Number(e.target.value))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Metrics Ecological: </label>
              <input
                type="number"
                value={metricsEcological}
                onChange={(e) => setMetricsEcological(Number(e.target.value))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Metrics Social: </label>
              <input
                type="number"
                value={metricsSocial}
                onChange={(e) => setMetricsSocial(Number(e.target.value))}
                required
                style={inputStyle}
              />
            </div>
            <button type="submit" style={buttonStyle}>
              Draft Proposal
            </button>
          </form>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Propose Norm Update</h3>
          <form onSubmit={handleNormSubmit}>
            <div>
              <label style={labelStyle}>Description: </label>
              <input
                type="text"
                value={normDescription}
                onChange={(e) => setNormDescription(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New Financial Goal: </label>
              <input
                type="number"
                value={normFinancial}
                onChange={(e) => setNormFinancial(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New Ecological Goal: </label>
              <input
                type="number"
                value={normEcological}
                onChange={(e) => setNormEcological(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New Social Goal: </label>
              <input
                type="number"
                value={normSocial}
                onChange={(e) => setNormSocial(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <button type="submit" style={buttonStyle}>
              Propose Norm Update
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProposalForm
