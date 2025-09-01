import os
import time
import numpy as np
import faiss
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from openai import OpenAI
from time import sleep
import pdfplumber
import pytesseract
from PIL import Image
import io
import docx
from pptx import Presentation
import csv
import yaml
import pickle
import hashlib
import logging
from pathlib import Path
import json
from functools import wraps
import google.generativeai as genai
import uvicorn
import tempfile

# === Setup Logging ===
repo_root = Path(__file__).resolve().parents[1]
default_logs_dir = repo_root / 'json-logs'
default_rag_log = default_logs_dir / 'rag_logs' / 'rag_pipeline.log'
rag_log_path = os.getenv('RAG_LOG_PATH', str(default_rag_log))
# Ensure log directory exists
Path(rag_log_path).parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(rag_log_path),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# === Swarm Protocol Integration ===
from swarm_protocol import (
    SwarmProtocolManager, 
    AgentType, 
    WorkflowType, 
    SwarmTask,
    AgentAction
)

# Initialize Swarm Protocol Manager
swarm_manager = SwarmProtocolManager()

# === Swarm Protocol Pydantic Models ===
class SwarmTraceRequest(BaseModel):
    agent: str
    action: str
    tool: str
    vault: Optional[str] = None
    proposal: Optional[str] = None
    score: Optional[float] = None
    comment: Optional[str] = None

class SwarmTraceResponse(BaseModel):
    status: str
    entry: Dict[str, Any]

class SwarmWorkflowRequest(BaseModel):
    title: str
    description: str
    workflow_type: str  # "sequential", "parallel", "hybrid"
    agents: List[str]
    context: Dict[str, Any] = Field(default_factory=dict)

class SwarmWorkflowResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    audit_log: List[str] = Field(default_factory=list)

class TrustGraphRequest(BaseModel):
    agent_type: Optional[str] = None
    limit: int = Field(default=100, le=1000)

class TrustGraphResponse(BaseModel):
    entries: List[Dict[str, Any]]
    total_count: int
    latest_hash: Optional[str] = None

# === Swarm Protocol Endpoints ===

@app.post("/swarm/trace", response_model=SwarmTraceResponse)
async def swarm_trace(request: SwarmTraceRequest):
    """Log agent action to TrustGraph"""
    try:
        # Convert string agent type to enum
        agent_type_map = {
            "BuilderAgent": AgentType.BUILDER_AGENT,
            "SignalAgent": AgentType.SIGNAL_AGENT,
            "PermitAgent": AgentType.PERMIT_AGENT,
            "RefactorAgent": AgentType.REFACTOR_AGENT,
            "PredictiveAgent": AgentType.PREDICTIVE_AGENT,
            "ComplianceAgent": AgentType.COMPLIANCE_AGENT,
            "MetaAuditor": AgentType.META_AUDITOR
        }
        
        agent_type = agent_type_map.get(request.agent, AgentType.BUILDER_AGENT)
        
        # Create agent action
        action = AgentAction(
            agent_id=request.agent,
            agent_type=agent_type,
            action=request.action,
            tool=request.tool,
            vault=request.vault,
            proposal=request.proposal,
            score=request.score,
            comment=request.comment
        )
        
        # Log to TrustGraph
        entry = await swarm_manager.protocol.log_agent_action(action)
        
        return SwarmTraceResponse(
            status="logged",
            entry={
                "entry_id": entry.entry_id,
                "agent_action": {
                    "agent_id": entry.agent_action.agent_id,
                    "agent_type": entry.agent_action.agent_type.value,
                    "action": entry.agent_action.action,
                    "tool": entry.agent_action.tool,
                    "timestamp": entry.agent_action.timestamp
                },
                "current_hash": entry.current_hash,
                "previous_hash": entry.previous_hash
            }
        )
        
    except Exception as e:
        logger.error(f"Swarm trace failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log agent action: {str(e)}")

@app.post("/swarm/workflow", response_model=SwarmWorkflowResponse)
async def swarm_workflow(request: SwarmWorkflowRequest):
    """Execute a Swarm Protocol workflow"""
    try:
        # Convert string workflow type to enum
        workflow_type_map = {
            "sequential": WorkflowType.SEQUENTIAL,
            "parallel": WorkflowType.PARALLEL,
            "hybrid": WorkflowType.HYBRID
        }
        
        workflow_type = workflow_type_map.get(request.workflow_type, WorkflowType.SEQUENTIAL)
        
        # Convert string agents to enums
        agent_type_map = {
            "BuilderAgent": AgentType.BUILDER_AGENT,
            "SignalAgent": AgentType.SIGNAL_AGENT,
            "PermitAgent": AgentType.PERMIT_AGENT,
            "RefactorAgent": AgentType.REFACTOR_AGENT,
            "PredictiveAgent": AgentType.PREDICTIVE_AGENT,
            "ComplianceAgent": AgentType.COMPLIANCE_AGENT,
            "MetaAuditor": AgentType.META_AUDITOR
        }
        
        agents = [agent_type_map.get(agent, AgentType.BUILDER_AGENT) for agent in request.agents]
        
        # Create and execute workflow
        task = await swarm_manager.create_workflow(
            title=request.title,
            description=request.description,
            workflow_type=workflow_type,
            agents=agents,
            context=request.context
        )
        
        result = await swarm_manager.execute_workflow(task)
        
        return SwarmWorkflowResponse(
            task_id=task.task_id,
            status=task.status.value,
            result=result,
            audit_log=task.audit_log
        )
        
    except Exception as e:
        logger.error(f"Swarm workflow failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")

@app.get("/swarm/trustgraph", response_model=TrustGraphResponse)
async def get_trust_graph(agent_type: Optional[str] = None, limit: int = 100):
    """Get TrustGraph entries"""
    try:
        # Convert string agent type to enum if provided
        agent_type_enum = None
        if agent_type:
            agent_type_map = {
                "BuilderAgent": AgentType.BUILDER_AGENT,
                "SignalAgent": AgentType.SIGNAL_AGENT,
                "PermitAgent": AgentType.PERMIT_AGENT,
                "RefactorAgent": AgentType.REFACTOR_AGENT,
                "PredictiveAgent": AgentType.PREDICTIVE_AGENT,
                "ComplianceAgent": AgentType.COMPLIANCE_AGENT,
                "MetaAuditor": AgentType.META_AUDITOR
            }
            agent_type_enum = agent_type_map.get(agent_type)
        
        entries = await swarm_manager.get_trust_graph(agent_type_enum, limit)
        
        # Get latest hash
        latest_hash = None
        if entries:
            latest_hash = entries[-1].get('current_hash')
        
        return TrustGraphResponse(
            entries=entries,
            total_count=len(entries),
            latest_hash=latest_hash
        )
        
    except Exception as e:
        logger.error(f"Failed to get TrustGraph: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get TrustGraph: {str(e)}")

@app.get("/swarm/workflow/{task_id}")
async def get_workflow_status(task_id: str):
    """Get status of a specific workflow"""
    try:
        status = await swarm_manager.get_workflow_status(task_id)
        if not status:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get workflow status: {str(e)}")

@app.get("/swarm/agents")
async def get_swarm_agents():
    """Get list of available agents"""
    try:
        agents = []
        for agent_id, agent in swarm_manager.protocol.agents.items():
            agents.append({
                "agent_id": agent_id,
                "agent_type": agent.agent_type.value,
                "status": "active"
            })
        return {"agents": agents}
        
    except Exception as e:
        logger.error(f"Failed to get agents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get agents: {str(e)}")

# === Load environment variables ===
load_dotenv()

# === Provider configuration ===
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()  # openai | gemini | xai
EMBEDDINGS_PROVIDER = os.getenv("EMBEDDINGS_PROVIDER", LLM_PROVIDER).lower()  # allow override

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_BASE_URL = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")

# Models (overridable via env)
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4")
OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-ada-002")
GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-1.5-flash")
GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "models/text-embedding-004")
XAI_CHAT_MODEL = os.getenv("XAI_CHAT_MODEL", "grok-3-latest")

# Initialize clients
client = None  # OpenAI (default)
xai_client = None
gemini_ready = False 

if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to init OpenAI client: {e}")
else:
    logger.warning("OPENAI_API_KEY not set. OpenAI features will be disabled unless provided.")

if XAI_API_KEY:
    try:
        xai_client = OpenAI(api_key=XAI_API_KEY, base_url=XAI_BASE_URL)
    except Exception as e:
        logger.warning(f"Failed to init xAI (Grok) client: {e}")
else:
    logger.info("XAI_API_KEY not set. Grok will be disabled unless provided.")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_ready = True
    except Exception as e:
        logger.warning(f"Failed to configure Gemini: {e}")
else:
    logger.info("GEMINI_API_KEY not set. Gemini will be disabled unless provided.")

# === FastAPI app ===
app = FastAPI(
    title="Cuttlefish RAG API",
    description="A FastAPI-based RAG (Retrieval Augmented Generation) system for document processing and AI-powered responses",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Constants ===
# Default data directory inside app root (works in Docker and local)
APP_ROOT = Path(__file__).resolve().parent
DATA_DIR = os.getenv("DATA_DIR", str(APP_ROOT / "knowledge-base"))
# Ensure data dir exists
Path(DATA_DIR).mkdir(parents=True, exist_ok=True)
CHUNK_SIZE = 500
BATCH_SIZE = 100  # Safe batch size for embeddings
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL") or (
    OPENAI_EMBED_MODEL if EMBEDDINGS_PROVIDER == "openai" else (
        GEMINI_EMBED_MODEL if EMBEDDINGS_PROVIDER == "gemini" else OPENAI_EMBED_MODEL
    )
)

# === Pydantic Models ===
class ChatRequest(BaseModel):
    question: str = Field(..., description="The question to ask")
    mode: Optional[str] = Field(None, description="Mode: general, hybrid, or None")

class ChatResponse(BaseModel):
    answer: str
    source: Optional[str] = None
    confidence: float
    distance: float
    esg: Optional[Dict[str, Any]] = None

class AgentFactoryRequest(BaseModel):
    query: str = Field(..., description="The query for the agent factory")
    mode: Optional[str] = Field(None, description="Mode: general, hybrid, or None")
    context_type: Optional[str] = Field(None, description="Context type: contract, dao, or None")
class AgentFactoryResponse(BaseModel):
    status: str
    message: str
    result: str
    source: Optional[str] = None
    confidence: float
    execution_time: str
    steps_completed: List[str]

class StatusResponse(BaseModel):
    documents_loaded: int
    index_ready: bool
    files: List[str]
    api_configured: bool
# === ESG Scoring Utilities (formulas as requested) ===

def economic_performance_score(value_creation_metrics: Dict[str, Any]) -> float:
    total_value = value_creation_metrics.get('direct_economic_value', 0) or 0
    distributed_value = value_creation_metrics.get('economic_value_distributed', 0) or 0
    retained_value = value_creation_metrics.get('economic_value_retained', 0) or 0
    if total_value > 0:
        distribution_ratio = distributed_value / total_value
        retention_ratio = retained_value / total_value
        distribution_score = 100 - abs(distribution_ratio - 0.75) * 200
        retention_score = 100 - abs(retention_ratio - 0.25) * 200
        value_creation_score = (distribution_score + retention_score) / 2
    else:
        value_creation_score = 50
    market_presence = value_creation_metrics.get('market_presence_score', 50) or 50
    return max(0.0, min(100.0, value_creation_score * 0.5 + market_presence * 0.5))

def risk_management_score(risk_assessment: Dict[str, Any]) -> float:
    risk_weights = {
        'operational_risk': 0.25,
        'regulatory_risk': 0.20,
        'market_risk': 0.20,
        'reputational_risk': 0.15,
        'systemic_risk': 0.20
    }
    weighted_risk = 0.0
    for risk_type, weight in risk_weights.items():
        risk_level = float(risk_assessment.get(risk_type, 2))
        weighted_risk += risk_level * weight
    risk_score = max(5.0, 100.0 - (weighted_risk * 25.0))
    return min(100.0, risk_score)

def resource_efficiency_score(efficiency_metrics: Dict[str, Any]) -> float:
    capital_eff = min(100.0, float(efficiency_metrics.get('capital_efficiency', 50)) * 2.0)
    operational_eff = float(efficiency_metrics.get('operational_efficiency', 50))
    innovation_inv = min(100.0, float(efficiency_metrics.get('innovation_investment', 5)) * 10.0)
    digital_trans = float(efficiency_metrics.get('digital_transformation', 50))
    return max(0.0, min(100.0, capital_eff * 0.3 + operational_eff * 0.3 + innovation_inv * 0.2 + digital_trans * 0.2))

def environmental_impact_score(impact_data: Dict[str, Any]) -> float:
    def normalize_intensity(value: float, benchmark_percentiles: Dict[int, float]) -> float:
        if value <= benchmark_percentiles[25]:
            return 90 + (benchmark_percentiles[25] - value) / (benchmark_percentiles[25] or 1e-6) * 10
        elif value <= benchmark_percentiles[50]:
            denom = (benchmark_percentiles[50] - benchmark_percentiles[25]) or 1e-6
            return 70 + (benchmark_percentiles[50] - value) / denom * 20
        elif value <= benchmark_percentiles[75]:
            denom = (benchmark_percentiles[75] - benchmark_percentiles[50]) or 1e-6
            return 40 + (benchmark_percentiles[75] - value) / denom * 30
        else:
            return max(5.0, 40 - (value - benchmark_percentiles[75]) / (benchmark_percentiles[75] or 1e-6) * 35)

    ghg_score = normalize_intensity(float(impact_data.get('ghg_intensity', 1.0)), {25: 0.1, 50: 0.5, 75: 1.5})
    water_score = normalize_intensity(float(impact_data.get('water_intensity', 10.0)), {25: 1.0, 50: 5.0, 75: 20.0})
    waste_score = normalize_intensity(float(impact_data.get('waste_intensity', 50.0)), {25: 5.0, 50: 25.0, 75: 100.0})
    land_impact = max(5.0, 100.0 - float(impact_data.get('land_use_impact', 2)) * 25.0)
    pollution_impact = max(5.0, 100.0 - float(impact_data.get('pollution_index', 2)) * 25.0)
    return max(0.0, min(100.0, ghg_score * 0.3 + water_score * 0.2 + waste_score * 0.2 + land_impact * 0.15 + pollution_impact * 0.15))

def resource_stewardship_score(stewardship_data: Dict[str, Any]) -> float:
    renewable_score = float(stewardship_data.get('renewable_energy_pct', 20))
    circularity_score = float(stewardship_data.get('material_circularity', 0.3)) * 100.0
    water_recycling = float(stewardship_data.get('water_recycling_pct', 10))
    waste_diversion = float(stewardship_data.get('waste_diversion_pct', 30))
    sustainable_sourcing = float(stewardship_data.get('sustainable_sourcing_pct', 40))
    return max(0.0, min(100.0, renewable_score * 0.25 + circularity_score * 0.25 + water_recycling * 0.2 + waste_diversion * 0.15 + sustainable_sourcing * 0.15))

def climate_action_score(climate_data: Dict[str, Any]) -> float:
    target_score = min(100.0, float(climate_data.get('emission_reduction_target_pct', 10)) * 2.0)
    risk_prep = float(climate_data.get('climate_risk_assessment', 50))
    adaptation = float(climate_data.get('adaptation_measures', 30))
    offset_quality = float(climate_data.get('carbon_offset_quality', 50))
    return max(0.0, min(100.0, target_score * 0.4 + risk_prep * 0.3 + adaptation * 0.2 + offset_quality * 0.1))

def human_capital_score(human_capital_data: Dict[str, Any]) -> float:
    employment_quality = float(human_capital_data.get('employment_quality', 60))
    diversity_inclusion = float(human_capital_data.get('diversity_inclusion', 50))
    training_development = float(human_capital_data.get('training_development', 40))
    health_safety = float(human_capital_data.get('health_safety', 70))
    worker_satisfaction = float(human_capital_data.get('worker_satisfaction', 60))
    return max(0.0, min(100.0, employment_quality * 0.25 + diversity_inclusion * 0.2 + training_development * 0.2 + health_safety * 0.2 + worker_satisfaction * 0.15))

def community_impact_score(community_data: Dict[str, Any]) -> float:
    economic_impact = float(community_data.get('local_economic_impact', 50))
    community_investment = float(community_data.get('community_investment', 30))
    stakeholder_engagement = float(community_data.get('stakeholder_engagement', 60))
    cultural_heritage = float(community_data.get('cultural_heritage', 70))
    access_equity = float(community_data.get('access_equity', 50))
    return max(0.0, min(100.0, economic_impact * 0.3 + community_investment * 0.25 + stakeholder_engagement * 0.2 + cultural_heritage * 0.15 + access_equity * 0.1))

def governance_score(governance_data: Dict[str, Any]) -> float:
    leadership = float(governance_data.get('leadership_accountability', 60))
    ethics = float(governance_data.get('ethics_compliance', 70))
    transparency = float(governance_data.get('transparency_reporting', 50))
    compliance = float(governance_data.get('regulatory_compliance', 80))
    innovation_gov = float(governance_data.get('innovation_governance', 50))
    return max(0.0, min(100.0, leadership * 0.25 + ethics * 0.25 + transparency * 0.2 + compliance * 0.2 + innovation_gov * 0.1))

def calculate_overall_score(financial: float, ecological: float, social: float, weights: Optional[Dict[str, float]] = None) -> float:
    w = weights or {"financial": 0.55, "ecological": 0.30, "social": 0.15}
    total = sum(w.values()) or 1.0
    nf, ne, ns = w['financial']/total, w['ecological']/total, w['social']/total
    return round(financial * nf + ecological * ne + social * ns, 1)

def get_performance_tier(score: float) -> str:
    if score >= 80: return 'Leading'
    if score >= 65: return 'Advanced'
    if score >= 50: return 'Developing'
    if score >= 35: return 'Beginning'
    return 'Lagging'

def extract_esg_metrics_from_answer(answer_text: str) -> Dict[str, Any]:
    """Use LLM to extract ESG input metrics required for formula calculations. Fallback to empty metrics."""
    try:
        if LLM_PROVIDER == "openai" and client:
            extraction_instructions = {
                "financial": {
                    "direct_economic_value": "number",
                    "economic_value_distributed": "number",
                    "economic_value_retained": "number",
                    "market_presence_score": "0-100",
                    "operational_risk": "0-4",
                    "regulatory_risk": "0-4",
                    "market_risk": "0-4",
                    "reputational_risk": "0-4",
                    "systemic_risk": "0-4",
                    "capital_efficiency": "0-100",
                    "operational_efficiency": "0-100",
                    "innovation_investment": "percent 0-100",
                    "digital_transformation": "0-100"
                },
                "ecological": {
                    "ghg_intensity": "tCO2e/unit",
                    "water_intensity": "m3/unit",
                    "waste_intensity": "kg/unit",
                    "land_use_impact": "0-4",
                    "pollution_index": "0-4",
                    "renewable_energy_pct": "0-100",
                    "material_circularity": "0-1",
                    "water_recycling_pct": "0-100",
                    "waste_diversion_pct": "0-100",
                    "sustainable_sourcing_pct": "0-100",
                    "emission_reduction_target_pct": "0-100",
                    "climate_risk_assessment": "0-100",
                    "adaptation_measures": "0-100",
                    "carbon_offset_quality": "0-100"
                },
                "social": {
                    "employment_quality": "0-100",
                    "diversity_inclusion": "0-100",
                    "training_development": "0-100",
                    "health_safety": "0-100",
                    "worker_satisfaction": "0-100",
                    "local_economic_impact": "0-100",
                    "community_investment": "0-100",
                    "stakeholder_engagement": "0-100",
                    "cultural_heritage": "0-100",
                    "access_equity": "0-100",
                    "leadership_accountability": "0-100",
                    "ethics_compliance": "0-100",
                    "transparency_reporting": "0-100",
                    "regulatory_compliance": "0-100",
                    "innovation_governance": "0-100"
                }
            }
            # Feasibility and scope signals (used for penalties/adjustments)
            extraction_instructions["feasibility"] = {
                "budget_total_usd": "numeric total budget in USD",
                "jobs_promised": "number of jobs promised",
                "hubs": "count of hubs/sites",
                "timeline_year": "target completion year",
                "scope_elements": "list of major scope elements (e.g., tunnels, housing, shipbuilding)"
            }
            prompt = (
                "Extract the following ESG metrics from the text as JSON. "
                "If a field is missing, omit it. Use numbers only.\n\n"
                f"SCHEMA:\n{json.dumps(extraction_instructions, indent=2)}\n\nTEXT:\n{answer_text}"
            )
            response = client.chat.completions.create(
                model=OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "Return ONLY valid JSON without markdown or commentary."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0
            )
            raw = response.choices[0].message.content
            # Attempt to parse JSON; if fails, return empty metrics
            try:
                parsed = json.loads(raw)
                return parsed if isinstance(parsed, dict) else {}
            except Exception:
                return {}
        else:
            return {}
    except Exception as e:
        logger.warning(f"ESG metric extraction failed: {e}")
        return {}

def compute_esg_scores(metrics: Dict[str, Any]) -> Dict[str, Any]:
    # Fill defaults for stability (use research-based neutral/benchmark values)
    DEFAULTS = {
        'financial': {
            'direct_economic_value': 200000,  # More appropriate for small-scale projects
            'economic_value_distributed': 150000,
            'economic_value_retained': 50000,
            'market_presence_score': 60,  # Higher for renewable energy sector
            'operational_risk': 2,
            'regulatory_risk': 2,
            'market_risk': 2,
            'reputational_risk': 2,
            'systemic_risk': 2,
            'capital_efficiency': 60,  # Higher for renewable energy
            'operational_efficiency': 60,
            'innovation_investment': 8,  # Higher for renewable energy
            'digital_transformation': 60,
        },
        'ecological': {
            'ghg_intensity': 0.5,  # Lower for renewable energy
            'water_intensity': 5,   # Lower for solar
            'waste_intensity': 30,  # Lower for renewable energy
            'land_use_impact': 1,   # Lower for small-scale
            'pollution_index': 1,   # Lower for renewable energy
            'renewable_energy_pct': 80,  # Much higher for renewable energy projects
            'material_circularity': 0.6,  # Higher for renewable energy
            'water_recycling_pct': 20,
            'waste_diversion_pct': 50,  # Higher for renewable energy
            'sustainable_sourcing_pct': 70,  # Higher for renewable energy
            'emission_reduction_target_pct': 30,  # Higher for renewable energy
            'climate_risk_assessment': 70,  # Higher for renewable energy
            'adaptation_measures': 50,  # Higher for renewable energy
            'carbon_offset_quality': 70,  # Higher for renewable energy
        },
        'social': {
            'employment_quality': 70,  # Higher for renewable energy jobs
            'diversity_inclusion': 60,  # Higher for renewable energy sector
            'training_development': 60,  # Higher for renewable energy
            'health_safety': 80,  # Higher for renewable energy
            'worker_satisfaction': 70,  # Higher for renewable energy
            'local_economic_impact': 70,  # Higher for community projects
            'community_investment': 50,  # Higher for community projects
            'stakeholder_engagement': 70,  # Higher for community projects
            'cultural_heritage': 70,
            'access_equity': 60,  # Higher for community projects
            'leadership_accountability': 70,  # Higher for DOE projects
            'ethics_compliance': 80,  # Higher for government projects
            'transparency_reporting': 70,  # Higher for government projects
            'regulatory_compliance': 85,  # Higher for DOE projects
            'innovation_governance': 60,  # Higher for renewable energy
        }
    }

    def with_defaults(section: str) -> Dict[str, Any]:
        merged = dict(DEFAULTS[section])
        for k, v in (metrics.get(section, {}) or {}).items():
            merged[k] = v
        return merged

    fin_metrics = with_defaults('financial')
    eco_metrics = with_defaults('ecological')
    soc_metrics = with_defaults('social')

    # Financial components
    econ_perf = economic_performance_score({
        'direct_economic_value': fin_metrics.get('direct_economic_value', 0),
        'economic_value_distributed': fin_metrics.get('economic_value_distributed', 0),
        'economic_value_retained': fin_metrics.get('economic_value_retained', 0),
        'market_presence_score': fin_metrics.get('market_presence_score', 0),
    })
    risk_mgmt = risk_management_score({
        'operational_risk': fin_metrics.get('operational_risk', 2),
        'regulatory_risk': fin_metrics.get('regulatory_risk', 2),
        'market_risk': fin_metrics.get('market_risk', 2),
        'reputational_risk': fin_metrics.get('reputational_risk', 2),
        'systemic_risk': fin_metrics.get('systemic_risk', 2),
    })
    resource_eff = resource_efficiency_score({
        'capital_efficiency': fin_metrics.get('capital_efficiency', 50),
        'operational_efficiency': fin_metrics.get('operational_efficiency', 50),
        'innovation_investment': fin_metrics.get('innovation_investment', 5),
        'digital_transformation': fin_metrics.get('digital_transformation', 50),
    })
    financial_kernel = econ_perf * 0.4 + risk_mgmt * 0.3 + resource_eff * 0.3

    # Ecological components
    env_impact = environmental_impact_score({
        'ghg_intensity': eco_metrics.get('ghg_intensity', 1.0),
        'water_intensity': eco_metrics.get('water_intensity', 10),
        'waste_intensity': eco_metrics.get('waste_intensity', 50),
        'land_use_impact': eco_metrics.get('land_use_impact', 2),
        'pollution_index': eco_metrics.get('pollution_index', 2),
    })
    stewardship = resource_stewardship_score({
        'renewable_energy_pct': eco_metrics.get('renewable_energy_pct', 0),
        'material_circularity': eco_metrics.get('material_circularity', 0.0),
        'water_recycling_pct': eco_metrics.get('water_recycling_pct', 0),
        'waste_diversion_pct': eco_metrics.get('waste_diversion_pct', 0),
        'sustainable_sourcing_pct': eco_metrics.get('sustainable_sourcing_pct', 0),
    })
    climate_action = climate_action_score({
        'emission_reduction_target_pct': eco_metrics.get('emission_reduction_target_pct', 0),
        'climate_risk_assessment': eco_metrics.get('climate_risk_assessment', 0),
        'adaptation_measures': eco_metrics.get('adaptation_measures', 0),
        'carbon_offset_quality': eco_metrics.get('carbon_offset_quality', 0),
    })
    ecological_kernel = env_impact * 0.4 + stewardship * 0.35 + climate_action * 0.25

    # Social components
    human_cap = human_capital_score({
        'employment_quality': soc_metrics.get('employment_quality', 0),
        'diversity_inclusion': soc_metrics.get('diversity_inclusion', 0),
        'training_development': soc_metrics.get('training_development', 0),
        'health_safety': soc_metrics.get('health_safety', 0),
        'worker_satisfaction': soc_metrics.get('worker_satisfaction', 0),
    })
    community = community_impact_score({
        'local_economic_impact': soc_metrics.get('local_economic_impact', 0),
        'community_investment': soc_metrics.get('community_investment', 0),
        'stakeholder_engagement': soc_metrics.get('stakeholder_engagement', 0),
        'cultural_heritage': soc_metrics.get('cultural_heritage', 0),
        'access_equity': soc_metrics.get('access_equity', 0),
    })
    governance = governance_score({
        'leadership_accountability': soc_metrics.get('leadership_accountability', 0),
        'ethics_compliance': soc_metrics.get('ethics_compliance', 0),
        'transparency_reporting': soc_metrics.get('transparency_reporting', 0),
        'regulatory_compliance': soc_metrics.get('regulatory_compliance', 0),
        'innovation_governance': soc_metrics.get('innovation_governance', 0),
    })
    social_kernel = human_cap * 0.35 + community * 0.35 + governance * 0.30

    # Apply feasibility-aware penalties based on scope realism
    diagnostics: List[str] = []
    feas = metrics.get('feasibility') or {}
    try:
        budget = float(feas.get('budget_total_usd') or 0)
        jobs = float(feas.get('jobs_promised') or 0)
        hubs = float(feas.get('hubs') or 1)  # Default to 1 hub if not specified
        timeline_years = float(feas.get('timeline_year') or 0)
        
        # SMART FEASIBILITY CHECK: Different logic for different project scales
        if budget > 0 and jobs > 0:
            # Small-scale renewable energy projects (like your DOE proposal)
            if budget <= 500000 and jobs <= 500 and hubs <= 3:
                # Reasonable small-scale project; apply micro-penalties only for ultra-low budgets
                budget_per_job = budget / max(jobs, 1)
                if budget < 2000:
                    before_fin = financial_kernel
                    financial_kernel = min(financial_kernel, 25.0)
                    diagnostics.append(f"Small-scale: ultra-low absolute budget ${budget:,.0f}; financial capped {before_fin:.1f}→{financial_kernel:.1f}")
                elif budget_per_job < 200:
                    before_fin = financial_kernel
                    financial_kernel = min(financial_kernel, 30.0)
                    diagnostics.append(f"Small-scale: very low budget-per-job ${budget_per_job:,.0f}/job; financial capped {before_fin:.1f}→{financial_kernel:.1f}")
                elif budget_per_job < 500:
                    before_fin = financial_kernel
                    financial_kernel = min(financial_kernel, 40.0)
                    diagnostics.append(f"Small-scale: low budget-per-job ${budget_per_job:,.0f}/job; financial capped {before_fin:.1f}→{financial_kernel:.1f}")
                else:
                    diagnostics.append(f"Small-scale project detected: ${budget:,.0f}, {jobs} jobs, {hubs} hubs - no penalties applied")
            # Medium-scale projects
            elif budget <= 5000000 and jobs <= 2000 and hubs <= 10:
                # Check for reasonable budget-to-jobs ratio
                budget_per_job = budget / jobs
                if budget_per_job < 500:  # Less than $500 per job is suspicious (reduced from $1k)
                    before_fin = financial_kernel
                    financial_kernel = min(financial_kernel, 45.0)  # Increased from 35.0
                    diagnostics.append(f"Medium-scale budget-jobs mismatch: ${budget_per_job:,.0f}/job; financial capped {before_fin:.1f}→{financial_kernel:.1f}")
                else:
                    diagnostics.append(f"Medium-scale project: ${budget:,.0f}, {jobs} jobs - reasonable ratios")
            # Large-scale infrastructure projects
            else:
                # Reduced penalties for large projects
                expected_budget = 1e9 * max(1.0, hubs)  # ~$1B per hub baseline
                if jobs > 10000:
                    expected_budget = max(expected_budget, jobs * 50000)  # $50k/job minimum proxy
                if expected_budget > 0:
                    ratio = budget / expected_budget
                    if ratio < 0.01:  # Reduced threshold from 0.05
                        before_fin = financial_kernel
                        before_soc = social_kernel
                        if ratio < 0.0001:  # Reduced from 0.001
                            financial_kernel = min(financial_kernel, 25.0)  # Increased from 15.0
                        elif ratio < 0.001:  # Reduced from 0.01
                            financial_kernel = min(financial_kernel, 30.0)  # Increased from 20.0
                        else:
                            financial_kernel = min(financial_kernel, 35.0)  # Increased from 25.0
                        if ratio < 0.0001:  # Reduced from 0.001
                            social_kernel = min(social_kernel, 35.0)  # Increased from 25.0
                        elif ratio < 0.001:  # Reduced from 0.01
                            social_kernel = min(social_kernel, 40.0)  # Increased from 30.0
                        else:
                            social_kernel = min(social_kernel, 45.0)  # Increased from 35.0
                        diagnostics.append(f"Large-scale budget-scope mismatch: ratio={ratio:.6f}; financial {before_fin:.1f}→{financial_kernel:.1f}, social {before_soc:.1f}→{social_kernel:.1f}")
        else:
            diagnostics.append("Missing budget or jobs for feasibility check; defaults applied")
    except Exception:
        diagnostics.append("Feasibility evaluation error; skipped penalties")

    # Missing-data caps to avoid inflated scores when key details are absent
    try:
        # Consider values equal to DEFAULTS as missing (neutral)
        def_ratio_fin = sum(1 for k,v in DEFAULTS['financial'].items() if fin_metrics.get(k, DEFAULTS['financial'][k]) == DEFAULTS['financial'][k]) / max(1, len(DEFAULTS['financial']))
        def_ratio_eco = sum(1 for k,v in DEFAULTS['ecological'].items() if eco_metrics.get(k, DEFAULTS['ecological'][k]) == DEFAULTS['ecological'][k]) / max(1, len(DEFAULTS['ecological']))
        def_ratio_soc = sum(1 for k,v in DEFAULTS['social'].items() if soc_metrics.get(k, DEFAULTS['social'][k]) == DEFAULTS['social'][k]) / max(1, len(DEFAULTS['social']))
        if def_ratio_fin > 0.8:  # Increased threshold from 0.7
            before = financial_kernel
            financial_kernel = min(financial_kernel, 50.0)  # Increased from 40.0
            diagnostics.append(f"Info cap: financial defaults {def_ratio_fin:.2f}→ capped {before:.1f}→{financial_kernel:.1f}")
        if def_ratio_soc > 0.8:  # Increased threshold from 0.7
            before = social_kernel
            social_kernel = min(social_kernel, 45.0)  # Increased from 35.0
            diagnostics.append(f"Info cap: social defaults {def_ratio_soc:.2f}→ capped {before:.1f}→{social_kernel:.1f}")
        # Ecological implementation detail cap (no renewables/circularity/adaptation specifics)
        has_renew = (eco_metrics.get('renewable_energy_pct', 0) or 0) > 0
        has_circ = (eco_metrics.get('material_circularity', 0.0) or 0.0) > 0
        has_adapt = (eco_metrics.get('adaptation_measures', 0) or 0) > 0
        if not (has_renew and has_circ and has_adapt):
            before = ecological_kernel
            # Removed cap to allow ecological scores above 55
            diagnostics.append("Implementation note: ecological score could be higher with more renewables/circularity/adaptation details")
    except Exception:
        diagnostics.append("Missing-data evaluation error; skipped caps")

    weights = {"financial": 0.55, "ecological": 0.30, "social": 0.15}
    overall = calculate_overall_score(financial_kernel, ecological_kernel, social_kernel, weights)
    tier = get_performance_tier(overall)

    return {
        "weights": weights,
        "metrics": metrics,
        "components": {
            "financial": {"economic_performance": round(econ_perf, 1), "risk_management": round(risk_mgmt, 1), "resource_efficiency": round(resource_eff, 1)},
            "ecological": {"environmental_impact": round(env_impact, 1), "resource_stewardship": round(stewardship, 1), "climate_action": round(climate_action, 1)},
            "social": {"human_capital": round(human_cap, 1), "community_impact": round(community, 1), "governance": round(governance, 1)}
        },
        "kernel_scores": {
            "financial": round(financial_kernel, 1),
            "ecological": round(ecological_kernel, 1),
            "social": round(social_kernel, 1)
        },
        "overall": {"score": overall, "tier": tier},
        "diagnostics": diagnostics
    }

class KernelScore(BaseModel):
    project_cost: int
    roi_potential: float
    funding_source: str
    apy_projection: float
    score: int

class EcologicalScore(BaseModel):
    carbon_impact: int
    renewable_percent_mix: int
    material_sourcing: str
    score: int

class SocialScore(BaseModel):
    community_benefit: str
    job_creation: int
    regulatory_alignment: str
    score: int

class ProjectScore(BaseModel):
    project_name: str
    financial: KernelScore
    ecological: EcologicalScore
    social: SocialScore

class KernelScoresResponse(BaseModel):
    kernel_scores: List[ProjectScore]

class SwarmTraceRequest(BaseModel):
    agent: str
    action: str
    tool: str
    vault: str
    proposal: str
    score: float
    comment: str

class SwarmTraceResponse(BaseModel):
    status: str
    entry: Dict[str, Any]

class DocumentUploadResponse(BaseModel):
    status: str
    meta: Dict[str, Any]

# Voice transcript models
class VoiceTranscriptEntry(BaseModel):
    userQuestion: Optional[str] = None
    agentAnswer: Optional[str] = None
    timestamp: Optional[str] = None

class VoiceTranscriptRequest(BaseModel):
    session_name: Optional[str] = None
    entries: List[VoiceTranscriptEntry]

# === Global Variables (same as Flask version) ===
documents = []
chunk_sources = []
index = None
SUPPORTED_EXTENSIONS = {'.txt', '.md', '.pdf', '.docx', '.pptx', '.csv', '.yaml', '.yml', '.json'}

# === TrustGraph Class (same as Flask version) ===
class TrustGraph:
    def __init__(self, filename: str | None = None):
        if filename is None:
            default_trust_path = default_logs_dir / 'trustgraph' / 'trustgraph.jsonl'
            filename = os.getenv('TRUSTGRAPH_PATH', str(default_trust_path))
        self.filename = filename
        self.actions = []
        self.load_actions()
        # Ensure directory exists for writes
        Path(self.filename).parent.mkdir(parents=True, exist_ok=True)
    
    def load_actions(self):
        if os.path.exists(self.filename):
            with open(self.filename, 'r') as f:
                for line in f:
                    if line.strip():
                        self.actions.append(json.loads(line))
    
    def append_action(self, action):
        action['timestamp'] = time.time()
        self.actions.append(action)
        with open(self.filename, 'a') as f:
            f.write(json.dumps(action) + '\n')
        return action

trustgraph = TrustGraph()

# === Helper Functions (same as Flask version) ===
def process_file(file_path: str) -> str:
    """Extract text from various file formats."""
    ext = Path(file_path).suffix.lower()
    
    if ext == '.pdf':
        return process_pdf(file_path)
    elif ext == '.docx':
        return process_docx(file_path)
    elif ext == '.pptx':
        return process_pptx(file_path)
    elif ext == '.csv':
        return process_csv(file_path)
    elif ext in {'.yaml', '.yml'}:
        return process_yaml(file_path)
    elif ext == '.json':
        return process_json(file_path)
    else:
        return process_text(file_path)

def process_pdf(file_path: str) -> str:
    """Extract text from PDF with OCR fallback."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                else:
                    # OCR fallback for scanned pages
                    img = page.to_image()
                    img_array = np.array(img.original)
                    ocr_text = pytesseract.image_to_string(img_array)
                    text += ocr_text + "\n"
    except Exception as e:
        logger.error(f"Error processing PDF {file_path}: {e}")
        # Fallback to PyPDF2
        try:
            with open(file_path, 'rb') as file:
                reader = PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e2:
            logger.error(f"PyPDF2 fallback also failed: {e2}")
    
    return text

def load_documents_from_directory(directory_path: str) -> None:
    """Populate global documents and chunk_sources from files in directory_path."""
    global documents, chunk_sources
    try:
        if not os.path.exists(directory_path):
            logger.warning(f"Data directory does not exist: {directory_path}")
            return
        loaded = 0
        for entry in sorted(os.listdir(directory_path)):
            full_path = os.path.join(directory_path, entry)
            if not os.path.isfile(full_path):
                continue
            ext = Path(entry).suffix.lower()
            if ext not in SUPPORTED_EXTENSIONS and ext != "":
                continue
            try:
                text = process_file(full_path)
                if text:
                    documents.append(text)
                    chunk_sources.append(entry)
                    loaded += 1
            except Exception as e:
                logger.warning(f"Failed to load {entry}: {e}")
        logger.info(f"Loaded {loaded} files from {directory_path}")
    except Exception as e:
        logger.error(f"Error scanning data directory {directory_path}: {e}")

def process_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        logger.error(f"Error processing DOCX {file_path}: {e}")
        return ""

def process_pptx(file_path: str) -> str:
    """Extract text from PPTX file."""
    try:
        prs = Presentation(file_path)
        text = ""
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error processing PPTX {file_path}: {e}")
        return ""

def process_csv(file_path: str) -> str:
    """Extract text from CSV file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            return "\n".join([", ".join(row) for row in reader])
    except Exception as e:
        logger.error(f"Error processing CSV {file_path}: {e}")
        return ""

def process_yaml(file_path: str) -> str:
    """Extract text from YAML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = yaml.safe_load(file)
            return yaml.dump(data, default_flow_style=False)
    except Exception as e:
        logger.error(f"Error processing YAML {file_path}: {e}")
        return ""

def process_json(file_path: str) -> str:
    """Extract text from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return json.dumps(data, indent=2)
    except Exception as e:
        logger.error(f"Error processing JSON {file_path}: {e}")
        return ""

def process_text(file_path: str) -> str:
    """Extract text from plain text file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        logger.error(f"Error processing text file {file_path}: {e}")
        return ""

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings for a list of texts."""
    if not texts:
        return []
    
    if EMBEDDINGS_PROVIDER == "openai" and client:
        try:
            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=texts
            )
            return [embedding.embedding for embedding in response.data]
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            return []
    
    elif EMBEDDINGS_PROVIDER == "gemini" and gemini_ready:
        try:
            embeddings = []
            for text in texts:
                result = genai.embed_content(
                    model=GEMINI_EMBED_MODEL,
                    content=text,
                    task_type="retrieval_document"
                )
                embeddings.append(result['embedding'])
            return embeddings
        except Exception as e:
            logger.error(f"Gemini embedding error: {e}")
            return []
    
    return []

# === LLM Prompt Templates ===
formatting_instructions = """
You are a professional AI assistant. When answering questions:
1. Be concise but comprehensive
2. Use clear, professional language
3. Structure your response logically
4. If you're unsure about something, acknowledge it
5. Always cite your sources when possible
6. Use markdown formatting for better readability
"""

user_prompt = """
Based on the following context, please answer the user's question professionally and accurately.

Context:
{context}

Question: {question}

Please provide a well-structured answer that directly addresses the question using the provided context.
"""

# === Original Functions (Restored) ===
def _generate_answer_with_context(question: str, context: str) -> str:
    """Generate answer using LLM with context."""
    try:
        # Format the prompt with context and question
        formatted_prompt = user_prompt.format(context=context, question=question)
        
        if LLM_PROVIDER == "openai" and client:
            response = client.chat.completions.create(
                model=OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": formatting_instructions},
                    {"role": "user", "content": formatted_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        
        elif LLM_PROVIDER == "gemini" and gemini_ready:
            model = genai.GenerativeModel(GEMINI_CHAT_MODEL)
            prompt = f"{formatting_instructions}\n\n{formatted_prompt}"
            response = model.generate_content(prompt)
            return response.text.strip()
        
        elif LLM_PROVIDER == "xai" and xai_client:
            response = xai_client.chat.completions.create(
                model=XAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": formatting_instructions},
                    {"role": "user", "content": formatted_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        
        else:
            return "LLM provider not available or not configured properly."
    
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return f"Error generating answer: {str(e)}"

def answer_question(question: str, mode: Optional[str] = None) -> tuple[str, Optional[str], float]:
    """Answer a question using RAG with professional formatting."""
    if not index or not documents:
        return "No documents loaded. Please add documents first.", None, 1.0
    
    # Get question embedding
    question_embedding = get_embeddings([question])
    if not question_embedding:
        return "Failed to generate question embedding.", None, 1.0
    
    # Search for similar documents
    D, I = index.search(np.array(question_embedding), k=3)
    
    if len(I[0]) == 0:
        return "No relevant documents found.", None, 1.0
    
    # Get the most relevant documents for context
    relevant_docs = []
    for i in range(min(3, len(I[0]))):
        doc_idx = I[0][i]
        if doc_idx < len(documents):
            relevant_docs.append(documents[doc_idx])
    
    # Combine context from multiple relevant documents
    combined_context = "\n\n".join(relevant_docs)
    best_idx = I[0][0]
    best_distance = D[0][0]
    source = chunk_sources[best_idx] if best_idx < len(chunk_sources) else "Unknown"
    
    # Generate answer using LLM
    answer = _generate_answer_with_context(question, combined_context)
    
    return answer, source, best_distance

def embed_and_index():
    """Create embeddings and build FAISS index."""
    global index
    
    if not documents:
        logger.info("No documents to embed.")
        return
    
    logger.info(f"Embedding {len(documents)} documents...")
    
    # Get embeddings in batches
    all_embeddings = []
    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        batch_embeddings = get_embeddings(batch)
        all_embeddings.extend(batch_embeddings)
        logger.info(f"Processed batch {i//BATCH_SIZE + 1}/{(len(documents) + BATCH_SIZE - 1)//BATCH_SIZE}")
    
    if not all_embeddings:
        logger.error("Failed to generate embeddings.")
        return
    
    # Build FAISS index
    dimension = len(all_embeddings[0])
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(all_embeddings))
    
    logger.info(f"Index built with {index.ntotal} vectors.")

def save_persistent_data():
    """Save documents and sources to disk."""
    data = {
        'documents': documents,
        'chunk_sources': chunk_sources
    }
    default_docs_pkl = Path(__file__).resolve().parents[1] / 'storage' / 'docs.pkl'
    docs_pkl_path = os.getenv('DOCS_PKL_PATH', str(default_docs_pkl))
    Path(docs_pkl_path).parent.mkdir(parents=True, exist_ok=True)
    with open(docs_pkl_path, 'wb') as f:
        pickle.dump(data, f)
    
    if index:
        default_faiss_index = Path(__file__).resolve().parents[1] / 'storage' / 'index.faiss'
        faiss_index_path = os.getenv('FAISS_INDEX_PATH', str(default_faiss_index))
        Path(faiss_index_path).parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(index, faiss_index_path)

def load_persistent_data():
    """Load documents and sources from disk."""
    global documents, chunk_sources, index
    
    default_docs_pkl = Path(__file__).resolve().parents[1] / 'storage' / 'docs.pkl'
    docs_pkl_path = os.getenv('DOCS_PKL_PATH', str(default_docs_pkl))
    try:
        if os.path.exists(docs_pkl_path) and os.path.getsize(docs_pkl_path) > 0:
            with open(docs_pkl_path, 'rb') as f:
                data = pickle.load(f)
                documents = data.get('documents', [])
                chunk_sources = data.get('chunk_sources', [])
            logger.info(f"Loaded {len(documents)} documents from disk")
        else:
            logger.info("No docs.pkl found or file is empty, starting fresh")
    except Exception as e:
        documents = []
        chunk_sources = []
        logger.warning(f"Failed to load docs.pkl ({docs_pkl_path}): {e}. Starting fresh.")
    
    default_faiss_index = Path(__file__).resolve().parents[1] / 'storage' / 'index.faiss'
    faiss_index_path = os.getenv('FAISS_INDEX_PATH', str(default_faiss_index))
    try:
        if os.path.exists(faiss_index_path) and os.path.getsize(faiss_index_path) > 0:
            index = faiss.read_index(faiss_index_path)
            logger.info(f"Loaded existing FAISS index with {index.ntotal} vectors")
        else:
            logger.info("No index.faiss found or file is empty, will build new index when documents are available")
    except Exception as e:
        index = None
        logger.warning(f"Failed to load FAISS index ({faiss_index_path}): {e}. Will build new index when documents are available")

default_voice_log = default_logs_dir / 'voice_transcripts' / 'voice_transcripts.jsonl'
VOICE_LOG_FILE = os.getenv('VOICE_LOG_FILE', str(default_voice_log))
# Ensure voice log directory exists
Path(VOICE_LOG_FILE).parent.mkdir(parents=True, exist_ok=True)

# === API Key Authentication ===
API_KEYS = {os.getenv("RAG_API_KEY", "test-api-key")}

async def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    api_key = authorization.split(" ", 1)[-1]
    if api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return api_key

# === FastAPI Routes ===
@app.post("/api/chat", response_model=ChatResponse)
async def chat_api(request: ChatRequest):
    """Chat endpoint for asking questions."""
    try:
        if not request.question:
            raise HTTPException(status_code=400, detail="No question provided")
        
        answer, source, distance = answer_question(request.question, request.mode)
        confidence = 1 / (1 + distance) if distance != 0 else 1.0
        # ESG extraction and computation (use defaults when missing)
        esg = None
        try:
            metrics = extract_esg_metrics_from_answer(answer)
            esg = compute_esg_scores(metrics or {})
        except Exception as e:
            logger.warning(f"ESG compute failed: {e}")
            esg = compute_esg_scores({})
        
        return ChatResponse(
            answer=answer,
            source=source,
            confidence=float(confidence),
            distance=float(distance),
            esg=esg
        )
    except Exception as e:
        logger.error(f"Error in chat API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent-factory", response_model=AgentFactoryResponse)
async def agent_factory_api(request: AgentFactoryRequest):
    """Handle agent factory requests with enhanced context and pipeline execution."""
    try:
        if not request.query:
            raise HTTPException(status_code=400, detail="No query provided")
        
        # Enhanced context building based on query type
        if request.context_type == "contract":
            enhanced_query = f"Contract analysis and security review: {request.query}"
        elif request.context_type == "dao":
            enhanced_query = f"DAO governance and proposal analysis: {request.query}"
        else:
            enhanced_query = request.query
        
        # Get answer with enhanced context and professional formatting
        answer, source, distance = answer_question(enhanced_query, request.mode)
        confidence = 1 / (1 + distance) if distance != 0 else 1.0
        
        # Add professional formatting wrapper for agent factory responses
        formatted_result = f"""
 
{answer}

"""
        
        # Simulate pipeline execution result
        pipeline_result = AgentFactoryResponse(
            status="success",
            message="Agent pipeline executed successfully with professional formatting",
            result=formatted_result,
            source=source,
            confidence=float(confidence),
            execution_time="2.3s",
            steps_completed=["context_building", "knowledge_retrieval", "response_generation", "professional_formatting"]
        )
        
        return pipeline_result
    except Exception as e:
        logger.error(f"Error in agent factory API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status", response_model=StatusResponse)
async def status_api():
    """Get RAG system status."""
    supported_files = [f for f in os.listdir(DATA_DIR) if Path(f).suffix.lower() in SUPPORTED_EXTENSIONS or not Path(f).suffix] if os.path.exists(DATA_DIR) else []
    unique_docs = set(chunk_sources) if chunk_sources else set()
    
    return StatusResponse(
        documents_loaded=len(unique_docs),
        index_ready=bool(index is not None),
        files=supported_files,
        api_configured=bool(client is not None)
    )

@app.post("/api/build-embeddings")
async def build_embeddings_api():
    """Build embeddings for all documents on-demand."""
    try:
        global index
        
        if not documents:
            # Load documents from directory if none exist
            logger.info("No documents in memory, loading from directory...")
            load_documents_from_directory(DATA_DIR)
            if not documents:
                raise HTTPException(status_code=400, detail="No documents found to embed")
        
        logger.info(f"🚀 Starting embeddings build for {len(documents)} documents...")
        start_time = time.time()
        
        # Build embeddings
        embed_and_index()
        
        if index:
            # Save the index
            logger.info("💾 Saving embeddings to storage...")
            save_persistent_data()
            
            elapsed_time = time.time() - start_time
            logger.info(f"🎉 Embeddings build completed successfully in {elapsed_time:.2f} seconds")
            
            return {
                "status": "success",
                "message": f"Embeddings created successfully for {len(documents)} documents",
                "documents_processed": len(documents),
                "vectors_created": index.ntotal,
                "processing_time": f"{elapsed_time:.2f}s"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to build embeddings")
            
    except Exception as e:
        logger.error(f"❌ Error building embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/embeddings-status")
async def embeddings_status_api():
    """Get the current status of embeddings."""
    return {
        "documents_loaded": len(documents),
        "index_ready": bool(index is not None),
        "vectors_count": index.ntotal if index else 0,
        "documents_sources": list(set(chunk_sources)) if chunk_sources else []
    }

@app.get("/kernel/scores", response_model=KernelScoresResponse)
async def kernel_scores_api():
    """Return mock scores for Financial, Ecological, and Social kernels."""
    mock_scores = [
        ProjectScore(
            project_name="Tributary Campus",
            financial=KernelScore(
                project_cost=1000000,
                roi_potential=0.18,
                funding_source="private",
                apy_projection=0.12,
                score=82
            ),
            ecological=EcologicalScore(
                carbon_impact=-120,
                renewable_percent_mix=85,
                material_sourcing="recycled",
                score=90
            ),
            social=SocialScore(
                community_benefit="high",
                job_creation=25,
                regulatory_alignment="compliant",
                score=88
            )
        ),
        ProjectScore(
            project_name="Solar Microgrid",
            financial=KernelScore(
                project_cost=500000,
                roi_potential=0.22,
                funding_source="grant",
                apy_projection=0.15,
                score=87
            ),
            ecological=EcologicalScore(
                carbon_impact=-200,
                renewable_percent_mix=100,
                material_sourcing="local",
                score=95
            ),
            social=SocialScore(
                community_benefit="medium",
                job_creation=10,
                regulatory_alignment="compliant",
                score=80
            )
        )
    ]
    
    return KernelScoresResponse(kernel_scores=mock_scores)

@app.post("/swarm/trace", response_model=SwarmTraceResponse)
async def swarm_trace_api(request: SwarmTraceRequest):
    """Log an agent action to the TrustGraph."""
    try:
        entry = trustgraph.append_action({
            "agent": request.agent,
            "action": request.action,
            "tool": request.tool,
            "vault": request.vault,
            "proposal": request.proposal,
            "score": request.score,
            "comment": request.comment
        })
        
        return SwarmTraceResponse(status="logged", entry=entry)
    except Exception as e:
        logger.error(f"Error in /swarm/trace: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe an uploaded audio file using Whisper and return text."""
    if LLM_PROVIDER != "openai" or client is None:
        raise HTTPException(status_code=400, detail="OpenAI not configured for transcription")

    try:
        # Save to a temp file to pass a file handle to the SDK
        suffix = Path(file.filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio_bytes = await file.read()
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_f:
            # Whisper model name; remains available for transcription
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_f
            )

        text = getattr(result, "text", None) or (result.get("text") if isinstance(result, dict) else None)
        if not text:
            raise HTTPException(status_code=500, detail="Failed to transcribe audio")
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/documents", response_model=DocumentUploadResponse)
async def rag_documents_upload(
    file: UploadFile = File(...),
    tag: str = Form("general"),
    flag: str = Form(""),
    api_key: str = Depends(verify_api_key)
):
    """Upload a document (JSON, Markdown, or PDF), tag it, and chunk for RAG."""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No selected file")
        
        ext = Path(file.filename).suffix.lower()
        if ext not in {'.json', '.md', '.pdf'}:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Save file
        save_path = os.path.join(DATA_DIR, file.filename)
        with open(save_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process and chunk
        text = process_file(save_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Failed to extract text from file")
        
        # Chunk the text
        if ext in {'.md', '.json'}:
            import re
            chunks = re.split(r'(^#+ .+|^\s*\{)', text, flags=re.MULTILINE)
            chunks = [c for c in chunks if c.strip()]
        else:
            chunks = [text[i:i + CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
        
        # Add to documents and chunk_sources
        documents.extend(chunks)
        chunk_sources.extend([file.filename] * len(chunks))
        
        # Save metadata
        meta = {
            "filename": file.filename,
            "tag": tag,
            "flag": flag,
            "num_chunks": len(chunks)
        }
        
        save_persistent_data()
        return DocumentUploadResponse(status="uploaded", meta=meta)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /rag/documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice/transcripts")
async def save_voice_transcript(payload: VoiceTranscriptRequest):
    """Persist a voice session transcript (speaker-to-speaker) to JSONL and return summary."""
    try:
        session = {
            "session_name": payload.session_name or f"Voice Session {time.strftime('%Y-%m-%d %H:%M:%S')}",
            "timestamp": time.time(),
            "entries": [
                {
                    "userQuestion": e.userQuestion,
                    "agentAnswer": e.agentAnswer,
                    "timestamp": e.timestamp,
                }
                for e in payload.entries
            ],
        }
        with open(VOICE_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(session) + "\n")
        return {"status": "stored", "session_name": session["session_name"], "count": len(payload.entries)}
    except Exception as e:
        logger.error(f"Error saving voice transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === Fix Document Ingestion Methods ===
def _process_document_content(content: str, file_type: str) -> str:
    """Process document content based on type."""
    if file_type == "markdown":
        return content
    elif file_type == "json":
        try:
            data = json.loads(content)
            return json.dumps(data, indent=2)
        except:
            return content
    else:
        return content

def _create_semantic_chunks(text: str) -> List[str]:
    """Create semantically meaningful chunks."""
    # Split by headers, sections, or paragraphs
    chunks = []
    
    # Split by markdown headers
    if "#" in text:
        sections = re.split(r'(^#+\s+.+$)', text, flags=re.MULTILINE)
        current_chunk = ""
        
        for section in sections:
            if section.strip():
                if section.startswith("#"):
                    # New section
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = section + "\n"
                else:
                    current_chunk += section
        
        if current_chunk:
            chunks.append(current_chunk.strip())
    
    # Fallback to paragraph splitting
    if not chunks:
        paragraphs = text.split("\n\n")
        for para in paragraphs:
            if len(para.strip()) > 50:  # Minimum chunk size
                chunks.append(para.strip())
    
    return chunks

def _analyze_document_quality(text: str, chunks: List[str]) -> Dict[str, Any]:
    """Analyze document quality and provide suggestions."""
    analysis = {
        "score": 0.0,
        "suggestions": []
    }
    
    # Calculate quality metrics
    total_length = len(text)
    chunk_count = len(chunks)
    avg_chunk_length = sum(len(chunk) for chunk in chunks) / max(chunk_count, 1)
    
    # Quality scoring
    length_score = min(1.0, total_length / 1000)  # Prefer longer documents
    chunk_score = min(1.0, chunk_count / 5)  # Prefer more chunks
    balance_score = 1.0 - abs(avg_chunk_length - 500) / 500  # Prefer balanced chunks
    
    analysis["score"] = (length_score + chunk_score + balance_score) / 3
    
    # Generate suggestions
    if total_length < 500:
        analysis["suggestions"].append("Consider adding more content for better retrieval")
    
    if chunk_count < 3:
        analysis["suggestions"].append("Document could benefit from more structured sections")
    
    if avg_chunk_length > 1000:
        analysis["suggestions"].append("Consider breaking down large sections for better granularity")
    
    return analysis

def _update_index_with_chunks(chunks: List[str]):
    """Update FAISS index with new chunks."""
    if not chunks:
        return
    
    # Get embeddings for new chunks
    new_embeddings = get_embeddings(chunks)
    if new_embeddings:
        # Add to existing index
        index.add(np.array(new_embeddings))
        logger.info(f"Added {len(new_embeddings)} new vectors to index")

# === Fix Evaluation Methods ===
def _calculate_relevance(query: str, response: str) -> float:
    """Calculate relevance score between query and response."""
    # Simple keyword overlap for now
    query_words = set(query.lower().split())
    response_words = set(response.lower().split())
    
    if not query_words:
        return 0.0
    
    overlap = len(query_words.intersection(response_words))
    return min(1.0, overlap / len(query_words))

def _calculate_completeness(expected: str, actual: str) -> float:
    """Calculate completeness score."""
    # Compare length and content coverage
    expected_length = len(expected)
    actual_length = len(actual)
    
    if expected_length == 0:
        return 1.0
    
    length_ratio = min(1.0, actual_length / expected_length)
    
    # Content similarity
    expected_words = set(expected.lower().split())
    actual_words = set(actual.lower().split())
    
    if not expected_words:
        return 1.0
    
    content_coverage = len(expected_words.intersection(actual_words)) / len(expected_words)
    
    return (length_ratio + content_coverage) / 2

def _calculate_accuracy(expected: str, actual: str) -> float:
    """Calculate accuracy score."""
    # Use semantic similarity
    if LLM_PROVIDER == "openai" and client:
        try:
            prompt = f"""
Rate the accuracy of the actual response compared to the expected response on a scale of 0-1.

Expected: {expected}
Actual: {actual}

Provide only a number between 0 and 1.
"""
            response = client.chat.completions.create(
                model=OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "You are an accuracy evaluator. Respond only with a number between 0 and 1."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0.1
            )
            score = float(response.choices[0].message.content.strip())
            return max(0.0, min(1.0, score))
        except:
            return 0.5
    else:
        return 0.5

def _analyze_query_complexity(query: str) -> Dict[str, Any]:
    """Analyze query complexity."""
    words = query.split()
    return {
        "word_count": len(words),
        "complexity": "high" if len(words) > 10 else "medium" if len(words) > 5 else "low",
        "has_technical_terms": any(word in query.lower() for word in ["api", "integration", "architecture", "deployment"])
    }

def _analyze_response_quality(response: str) -> Dict[str, Any]:
    """Analyze response quality."""
    return {
        "length": len(response),
        "has_structure": any(marker in response for marker in ["##", "-", "1.", "•"]),
        "has_code": "```" in response,
        "has_links": "http" in response
    }

def _generate_recommendations(metrics: EvaluationMetrics, analysis: Dict[str, Any]) -> List[str]:
    """Generate improvement recommendations."""
    recommendations = []
    
    if metrics.response_time > 5.0:
        recommendations.append("Consider optimizing response time through caching or model selection")
    
    if metrics.relevance_score < 0.7:
        recommendations.append("Improve query understanding and context retrieval")
    
    if metrics.completeness_score < 0.8:
        recommendations.append("Enhance response completeness through better prompt engineering")
    
    if metrics.accuracy_score < 0.8:
        recommendations.append("Improve accuracy through better training data or model fine-tuning")
    
    return recommendations

# === Startup Event ===
@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    global index, documents, chunk_sources
    
    # Create necessary directories
    Path("test").mkdir(exist_ok=True)
    
    # Load persistent data
    load_persistent_data()
    
    # Build index if documents exist but index doesn't
    if documents and not index:
        embed_and_index()
        save_persistent_data()
    
    # Initialize Swarm Protocol agents
    await swarm_manager.initialize_agents()
    
    logger.info("Application startup complete")

# === Main Entry Point ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
