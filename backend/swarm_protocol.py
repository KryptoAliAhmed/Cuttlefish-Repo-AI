"""
Swarm Protocol - Agent Orchestration Layer for Cuttlefish Labs
Enables multiple autonomous AI agents to work collaboratively with TrustGraph logging
"""

import asyncio
import hashlib
import json
import time
from datetime import datetime
import os
import json as _json
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass, asdict
from pydantic import BaseModel, Field
import logging
from pathlib import Path
import aiofiles
from concurrent.futures import ThreadPoolExecutor
import uuid
import os

logger = logging.getLogger(__name__)

# === Swarm Protocol Types ===

class AgentType(str, Enum):
    """Types of agents in the Swarm Protocol"""
    BUILDER_AGENT = "BuilderAgent"
    SIGNAL_AGENT = "SignalAgent"
    PERMIT_AGENT = "PermitAgent"
    REFACTOR_AGENT = "RefactorAgent"
    PREDICTIVE_AGENT = "PredictiveAgent"
    COMPLIANCE_AGENT = "ComplianceAgent"
    META_AUDITOR = "MetaAuditor"

class WorkflowType(str, Enum):
    """Types of agent workflows"""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    HYBRID = "hybrid"

class TaskStatus(str, Enum):
    """Status of tasks in the workflow"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    AUDITED = "audited"

@dataclass
class AgentAction:
    """Represents an action taken by an agent"""
    agent_id: str
    agent_type: AgentType
    action: str
    tool: str
    vault: Optional[str] = None
    proposal: Optional[str] = None
    score: Optional[float] = None
    comment: Optional[str] = None
    timestamp: float = None
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()

@dataclass
class TrustGraphEntry:
    """Entry in the TrustGraph for transparency and auditability"""
    entry_id: str
    agent_action: AgentAction
    previous_hash: Optional[str] = None
    current_hash: Optional[str] = None
    ipfs_reference: Optional[str] = None
    verified: bool = False

class SwarmTask(BaseModel):
    """Represents a task for the Swarm Protocol"""
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    workflow_type: WorkflowType
    agents: List[AgentType]
    context: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=1, ge=1, le=10)
    created_at: float = Field(default_factory=time.time)
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    audit_log: List[str] = Field(default_factory=list)

class SwarmProtocol:
    """Core Swarm Protocol implementation"""
    
    def __init__(self, trust_graph_path: str | None = None):
        # Default to shared json-logs/trustgraph/trustgraph.jsonl (same as rag_fastapi)
        if trust_graph_path is None:
            repo_root = Path(__file__).resolve().parents[1]
            default_logs_dir = repo_root / 'json-logs'
            default_trust_path = default_logs_dir / 'trustgraph' / 'trustgraph.jsonl'
            trust_graph_path = os.getenv('TRUSTGRAPH_PATH', str(default_trust_path))
        self.trust_graph_path = Path(trust_graph_path)
        self.trust_graph_path.parent.mkdir(parents=True, exist_ok=True)
        self.agents: Dict[str, 'BaseAgent'] = {}
        self.active_tasks: Dict[str, SwarmTask] = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.workflow_history: List[Dict[str, Any]] = []
        
    async def register_agent(self, agent: 'BaseAgent') -> bool:
        """Register an agent with the Swarm Protocol"""
        try:
            self.agents[agent.agent_id] = agent
            logger.info(f"Registered agent: {agent.agent_id} ({agent.agent_type})")
            return True
        except Exception as e:
            logger.error(f"Failed to register agent {agent.agent_id}: {e}")
            return False
    
    async def log_agent_action(self, action: AgentAction) -> TrustGraphEntry:
        """Log an agent action to the TrustGraph"""
        try:
            # Generate entry ID and hash
            entry_id = str(uuid.uuid4())
            
            # Get previous hash for chaining
            previous_hash = await self._get_latest_hash()
            
            # Create TrustGraph entry
            entry = TrustGraphEntry(
                entry_id=entry_id,
                agent_action=action,
                previous_hash=previous_hash
            )
            
            # Generate current hash
            entry.current_hash = self._generate_hash(entry)
            
            # Save to file
            await self._save_trust_graph_entry(entry)
            
            logger.info(f"Logged action: {action.agent_type} - {action.action}")
            return entry
            
        except Exception as e:
            logger.error(f"Failed to log agent action: {e}")
            raise
    
    async def execute_workflow(self, task: SwarmTask) -> Dict[str, Any]:
        """Execute a workflow with multiple agents"""
        try:
            task.status = TaskStatus.RUNNING
            self.active_tasks[task.task_id] = task
            
            logger.info(f"Starting workflow: {task.title} ({task.workflow_type})")
            
            if task.workflow_type == WorkflowType.SEQUENTIAL:
                result = await self._execute_sequential_workflow(task)
            elif task.workflow_type == WorkflowType.PARALLEL:
                result = await self._execute_parallel_workflow(task)
            else:  # HYBRID
                result = await self._execute_hybrid_workflow(task)
            
            # Meta-audit the result
            audit_result = await self._meta_audit_result(task, result)
            
            task.status = TaskStatus.AUDITED if audit_result['passed'] else TaskStatus.FAILED
            task.result = result
            task.audit_log.append(audit_result['audit_message'])
            
            # Log workflow completion
            await self._log_workflow_completion(task, result)
            
            return result
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            logger.error(f"Workflow execution failed: {e}")
            raise
    
    async def _execute_sequential_workflow(self, task: SwarmTask) -> Dict[str, Any]:
        """Execute agents sequentially"""
        context = task.context.copy()
        results = {}
        
        for agent_type in task.agents:
            agent = self._get_agent_by_type(agent_type)
            if not agent:
                logger.warning(f"Agent {agent_type} not found, skipping")
                continue
            
            try:
                # Execute agent with current context
                agent_result = await agent.execute(context)
                results[agent_type] = agent_result
                
                # Update context for next agent
                context.update(agent_result.get('context_updates', {}))
                
                # Log agent action
                action = AgentAction(
                    agent_id=agent.agent_id,
                    agent_type=agent_type,
                    action="execute",
                    tool="workflow",
                    proposal=task.title,
                    score=agent_result.get('confidence', 0.0),
                    comment=agent_result.get('summary', ''),
                    context=context
                )
                await self.log_agent_action(action)
                
            except Exception as e:
                logger.error(f"Agent {agent_type} execution failed: {e}")
                results[agent_type] = {'error': str(e)}
        
        return {
            'workflow_type': 'sequential',
            'results': results,
            'final_context': context
        }
    
    async def _execute_parallel_workflow(self, task: SwarmTask) -> Dict[str, Any]:
        """Execute agents in parallel"""
        async def execute_agent(agent_type: AgentType) -> tuple[str, Any]:
            agent = self._get_agent_by_type(agent_type)
            if not agent:
                return agent_type, {'error': 'Agent not found'}
            
            try:
                result = await agent.execute(task.context)
                
                # Log agent action
                action = AgentAction(
                    agent_id=agent.agent_id,
                    agent_type=agent_type,
                    action="execute",
                    tool="workflow",
                    proposal=task.title,
                    score=result.get('confidence', 0.0),
                    comment=result.get('summary', ''),
                    context=task.context
                )
                await self.log_agent_action(action)
                
                return agent_type, result
            except Exception as e:
                logger.error(f"Agent {agent_type} execution failed: {e}")
                return agent_type, {'error': str(e)}
        
        # Execute all agents in parallel
        tasks = [execute_agent(agent_type) for agent_type in task.agents]
        results_list = await asyncio.gather(*tasks)
        
        results = dict(results_list)
        
        return {
            'workflow_type': 'parallel',
            'results': results,
            'context': task.context
        }
    
    async def _execute_hybrid_workflow(self, task: SwarmTask) -> Dict[str, Any]:
        """Execute hybrid workflow (some sequential, some parallel)"""
        # This is a simplified hybrid implementation
        # In practice, you'd define more complex workflow patterns
        
        # Execute high-priority agents sequentially first
        priority_agents = [AgentType.BUILDER_AGENT, AgentType.PERMIT_AGENT]
        sequential_results = await self._execute_sequential_workflow(
            SwarmTask(
                title=f"{task.title}_sequential",
                description="Sequential phase",
                workflow_type=WorkflowType.SEQUENTIAL,
                agents=[a for a in task.agents if a in priority_agents],
                context=task.context
            )
        )
        
        # Execute remaining agents in parallel
        parallel_agents = [a for a in task.agents if a not in priority_agents]
        if parallel_agents:
            parallel_results = await self._execute_parallel_workflow(
                SwarmTask(
                    title=f"{task.title}_parallel",
                    description="Parallel phase",
                    workflow_type=WorkflowType.PARALLEL,
                    agents=parallel_agents,
                    context=sequential_results.get('final_context', task.context)
                )
            )
            
            # Combine results
            combined_results = {
                **sequential_results['results'],
                **parallel_results['results']
            }
            
            return {
                'workflow_type': 'hybrid',
                'sequential_results': sequential_results,
                'parallel_results': parallel_results,
                'combined_results': combined_results
            }
        
        return sequential_results
    
    async def _meta_audit_result(self, task: SwarmTask, result: Dict[str, Any]) -> Dict[str, Any]:
        """Meta-audit the workflow result using MetaAuditor agent"""
        try:
            meta_auditor = self._get_agent_by_type(AgentType.META_AUDITOR)
            if not meta_auditor:
                return {
                    'passed': True,
                    'audit_message': 'No meta-auditor available, skipping audit'
                }
            
            audit_context = {
                'task': task.dict(),
                'result': result,
                'esg_criteria': self._get_esg_criteria()
            }
            
            audit_result = await meta_auditor.execute(audit_context)
            
            # Log audit action
            action = AgentAction(
                agent_id=meta_auditor.agent_id,
                agent_type=AgentType.META_AUDITOR,
                action="audit",
                tool="meta_audit",
                proposal=task.title,
                score=audit_result.get('compliance_score', 0.0),
                comment=audit_result.get('audit_summary', ''),
                context=audit_context
            )
            await self.log_agent_action(action)
            
            return {
                'passed': audit_result.get('passed', True),
                'audit_message': audit_result.get('audit_summary', 'Audit completed'),
                'compliance_score': audit_result.get('compliance_score', 1.0)
            }
            
        except Exception as e:
            logger.error(f"Meta-audit failed: {e}")
            return {
                'passed': False,
                'audit_message': f'Audit failed: {e}'
            }
    
    def _get_esg_criteria(self) -> Dict[str, Any]:
        """Get ESG criteria for auditing"""
        return {
            'environmental': {
                'carbon_impact': 'positive',
                'renewable_energy': 'required',
                'sustainability_score': 0.7
            },
            'social': {
                'community_benefit': 'required',
                'job_creation': 'positive',
                'accessibility': 'inclusive'
            },
            'governance': {
                'transparency': 'required',
                'compliance': 'required',
                'stakeholder_engagement': 'positive'
            }
        }
    
    async def _log_workflow_completion(self, task: SwarmTask, result: Dict[str, Any]):
        """Log workflow completion"""
        action = AgentAction(
            agent_id="swarm_protocol",
            agent_type=AgentType.BUILDER_AGENT,  # Placeholder
            action="workflow_complete",
            tool="swarm_protocol",
            proposal=task.title,
            score=result.get('overall_score', 0.0),
            comment=f"Workflow {task.workflow_type} completed with status {task.status}",
            context={'task_id': task.task_id, 'result_summary': result}
        )
        await self.log_agent_action(action)
    
    def _get_agent_by_type(self, agent_type: AgentType) -> Optional['BaseAgent']:
        """Get agent instance by type"""
        for agent in self.agents.values():
            if agent.agent_type == agent_type:
                return agent
        return None
    
    def _generate_hash(self, entry: TrustGraphEntry) -> str:
        """Generate hash for TrustGraph entry"""
        # Convert AgentAction to dict, handling FieldInfo objects
        action_dict = {
            'agent_id': entry.agent_action.agent_id,
            'agent_type': entry.agent_action.agent_type.value,
            'action': entry.agent_action.action,
            'tool': entry.agent_action.tool,
            'vault': entry.agent_action.vault,
            'proposal': entry.agent_action.proposal,
            'score': entry.agent_action.score,
            'comment': entry.agent_action.comment,
            'timestamp': entry.agent_action.timestamp,
            'context': entry.agent_action.context,
            'metadata': entry.agent_action.metadata
        }
        
        data = {
            'entry_id': entry.entry_id,
            'agent_action': action_dict,
            'previous_hash': entry.previous_hash,
            'timestamp': time.time()
        }
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    async def _get_latest_hash(self) -> Optional[str]:
        """Get the latest hash from TrustGraph"""
        try:
            if not self.trust_graph_path.exists():
                return None
            
            async with aiofiles.open(self.trust_graph_path, 'r') as f:
                lines = await f.readlines()
                if lines:
                    last_line = lines[-1].strip()
                    if last_line:
                        entry_data = json.loads(last_line)
                        return entry_data.get('current_hash')
            return None
        except Exception as e:
            logger.error(f"Failed to get latest hash: {e}")
            return None
    
    async def _save_trust_graph_entry(self, entry: TrustGraphEntry):
        """Save TrustGraph entry to file"""
        try:
            # Convert AgentAction to dict, handling FieldInfo objects
            action_dict = {
                'agent_id': entry.agent_action.agent_id,
                'agent_type': entry.agent_action.agent_type.value,
                'action': entry.agent_action.action,
                'tool': entry.agent_action.tool,
                'vault': entry.agent_action.vault,
                'proposal': entry.agent_action.proposal,
                'score': entry.agent_action.score,
                'comment': entry.agent_action.comment,
                'timestamp': entry.agent_action.timestamp,
                'context': entry.agent_action.context,
                'metadata': entry.agent_action.metadata
            }
            
            entry_data = {
                'entry_id': entry.entry_id,
                'agent_action': action_dict,
                'previous_hash': entry.previous_hash,
                'current_hash': entry.current_hash,
                'ipfs_reference': entry.ipfs_reference,
                'verified': entry.verified,
                'timestamp': datetime.now().isoformat()
            }
            
            async with aiofiles.open(self.trust_graph_path, 'a') as f:
                await f.write(json.dumps(entry_data) + '\n')
                
        except Exception as e:
            logger.error(f"Failed to save TrustGraph entry: {e}")
            raise
    
    async def get_trust_graph_entries(self, 
                                    agent_type: Optional[AgentType] = None,
                                    limit: int = 100) -> List[Dict[str, Any]]:
        """Get TrustGraph entries with optional filtering"""
        try:
            entries = []
            async with aiofiles.open(self.trust_graph_path, 'r') as f:
                async for line in f:
                    if len(entries) >= limit:
                        break
                    
                    entry_data = json.loads(line.strip())
                    if agent_type is None or entry_data['agent_action']['agent_type'] == agent_type.value:
                        entries.append(entry_data)
            
            return entries[-limit:]  # Return most recent entries
            
        except Exception as e:
            logger.error(f"Failed to get TrustGraph entries: {e}")
            return []
    
    async def get_workflow_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific workflow"""
        task = self.active_tasks.get(task_id)
        if not task:
            return None
        
        return {
            'task_id': task.task_id,
            'title': task.title,
            'status': task.status,
            'workflow_type': task.workflow_type,
            'agents': [agent.value for agent in task.agents],
            'created_at': task.created_at,
            'result': task.result,
            'audit_log': task.audit_log
        }

# === Base Agent Class ===

class BaseAgent:
    """Base class for all agents in the Swarm Protocol"""
    
    def __init__(self, agent_id: str, agent_type: AgentType):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.context_shared = {}
        self.execution_history = []
        self._redis = None
        self._redis_key = os.getenv('REDIS_SHARED_KEY', 'swarm:shared')
        self._init_redis()
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's main logic"""
        raise NotImplementedError("Subclasses must implement execute method")
    
    async def share_context(self, context: Dict[str, Any]):
        """Share context with other agents"""
        self.context_shared.update(context)
        if self._redis:
            try:
                # store per-agent shared context
                data = _json.dumps(self.context_shared)
                self._redis.hset(self._redis_key, self.agent_id, data)
            except Exception as e:
                logger.warning(f"Redis share_context failed: {e}")
    
    async def get_shared_context(self) -> Dict[str, Any]:
        """Get shared context"""
        merged = self.context_shared.copy()
        if self._redis:
            try:
                raw = self._redis.hget(self._redis_key, self.agent_id)
                if raw:
                    from_json = _json.loads(raw)
                    if isinstance(from_json, dict):
                        merged.update(from_json)
            except Exception as e:
                logger.warning(f"Redis get_shared_context failed: {e}")
        return merged

    def _init_redis(self):
        url = os.getenv('REDIS_URL')
        if not url:
            return
        try:
            import redis  # type: ignore
            self._redis = redis.Redis.from_url(url, decode_responses=True)
            # ping to validate
            self._redis.ping()
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            self._redis = None

# === Concrete Agent Implementations ===

class BuilderAgent(BaseAgent):
    """BuilderAgent for capital allocation and infrastructure proposals"""
    
    def __init__(self):
        super().__init__("builder_agent_001", AgentType.BUILDER_AGENT)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Simulate capital allocation logic
            proposal = context.get('proposal', 'solar_farm_optimization')
            budget = context.get('budget', 1000000)
            
            # Generate proposal
            result = {
                'proposal_id': f"BUILD_{int(time.time())}",
                'type': 'capital_allocation',
                'target': proposal,
                'budget_allocated': budget * 0.8,
                'roi_estimate': 0.15,
                'timeline': '6 months',
                'confidence': 0.85,
                'summary': f'Proposed {proposal} with ${budget * 0.8:,.0f} allocation',
                'context_updates': {
                    'proposal_status': 'submitted',
                    'budget_remaining': budget * 0.2
                }
            }
            
            self.execution_history.append({
                'timestamp': time.time(),
                'action': 'capital_allocation',
                'result': result
            })
            
            return result
            
        except Exception as e:
            logger.error(f"BuilderAgent execution failed: {e}")
            return {'error': str(e)}

class PermitAgent(BaseAgent):
    """PermitAgent for infrastructure compliance checks"""
    
    def __init__(self):
        super().__init__("permit_agent_001", AgentType.PERMIT_AGENT)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from backend.providers.compliance_provider import get_compliance
            proposal = context.get('proposal', 'solar_farm_optimization')
            comp = get_compliance(context)
            score = float(comp.get('overall_compliance', 0.8))
            approved = all([
                comp.get('environmental_approved', True),
                comp.get('zoning_approved', True),
                comp.get('safety_approved', True),
            ])
            result = {
                'compliance_id': f"PERMIT_{int(time.time())}",
                'type': 'infrastructure_compliance',
                'target': proposal,
                **{k: v for k, v in comp.items() if k != 'error'},
                'confidence': 0.85,
                'summary': f"Compliance {'approved' if approved else 'rejected'} with score {score:.2f}",
                'context_updates': {
                    'compliance_status': 'approved' if approved else 'rejected',
                    'compliance_score': score
                }
            }
            self.execution_history.append({'timestamp': time.time(), 'action': 'compliance_check', 'result': result})
            return result
        except Exception as e:
            logger.error(f"PermitAgent execution failed: {e}")
            return {'error': str(e)}

class SignalAgent(BaseAgent):
    """SignalAgent for market analysis and trading signals"""
    
    def __init__(self):
        super().__init__("signal_agent_001", AgentType.SIGNAL_AGENT)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from backend.providers.market_provider import get_market_signal
            symbol = context.get('symbol', 'BTC/USDT')
            sig = get_market_signal({'symbol': symbol, **context})
            signal = sig.get('signal', 'HOLD')
            confidence = float(sig.get('confidence', 0.6))
            result = {
                'signal_id': f"SIGNAL_{int(time.time())}",
                'type': 'market_signal',
                'asset': symbol,
                'signal': signal,
                'confidence': confidence,
                'summary': f"Signal {signal} ({confidence:.2f}) via {sig.get('source','provider')}",
                'context_updates': {
                    'trading_signal': signal,
                    'signal_confidence': confidence
                }
            }
            self.execution_history.append({'timestamp': time.time(), 'action': 'market_analysis', 'result': result})
            # Optional autotrade
            if os.getenv('TREASURY_AUTOTRADE', 'false').lower() == 'true':
                try:
                    from backend.treasury_sim import simulator
                    agent_id = str(context.get('agent_id', 'auto-agent'))
                    # naive action: if BUY, swap 1 unit from USDC to WETH in demo vault
                    if signal == 'BUY':
                        simulator.ensure_vault(agent_id)
                        # attempt small seed if empty
                        if simulator.get_vault(agent_id).balances.get('USDC', 0) < 1:
                            simulator.seed_balance(agent_id, 'USDC', 10)
                        simulator.swap(agent_id, 'USDC', 'WETH', 1.0, 0.0)
                except Exception as e:
                    logger.warning(f"Autotrade failed: {e}")
            return result
        except Exception as e:
            logger.error(f"SignalAgent execution failed: {e}")
            return {'error': str(e)}

class PredictiveAgent(BaseAgent):
    """PredictiveAgent for forecasting and predictive analytics"""
    
    def __init__(self):
        super().__init__("predictive_agent_001", AgentType.PREDICTIVE_AGENT)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from backend.providers.market_provider import fetch_signal_from_ccxt
            from backend.providers.predict_provider import get_prediction
            symbol = context.get('symbol', 'BTC/USDT')
            # If timeseries provider selected, supply OHLCV for forecast baseline
            ohlcv = None
            if os.getenv('PREDICT_PROVIDER', 'mock').lower() == 'timeseries':
                try:
                    import ccxt  # type: ignore
                    ex = getattr(__import__('ccxt'), os.getenv('PREDICT_CCXT_EXCHANGE', 'binance'))({"enableRateLimit": True})
                    ohlcv = ex.fetch_ohlcv(symbol, timeframe='1h', limit=200)
                except Exception:
                    ohlcv = None
            pred = get_prediction({'symbol': symbol, **context}, ohlcv)
            predicted_price = pred.get('predicted_price')
            trend = pred.get('trend_direction', 'sideways')
            confidence = float(pred.get('confidence', 0.6))
            result = {
                'prediction_id': f"PRED_{int(time.time())}",
                'type': 'market_forecast',
                'asset': symbol,
                'timeframe': context.get('horizon', '30d'),
                'predicted_price': predicted_price,
                'confidence': confidence,
                'trend_direction': trend,
                'summary': f"Forecast {trend} ({confidence:.2f})",
                'context_updates': {
                    'prediction_confidence': confidence,
                    'forecast_trend': trend
                }
            }
            self.execution_history.append({'timestamp': time.time(), 'action': 'predictive_analysis', 'result': result})
            return result
        except Exception as e:
            logger.error(f"PredictiveAgent execution failed: {e}")
            return {'error': str(e)}

class ComplianceAgent(BaseAgent):
    """ComplianceAgent for regulatory compliance and risk assessment"""
    
    def __init__(self):
        super().__init__("compliance_agent_001", AgentType.COMPLIANCE_AGENT)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from backend.providers.compliance_provider import get_compliance
            comp = get_compliance(context)
            score = float(comp.get('overall_compliance', comp.get('compliance_score', 0.8)))
            risk = 'low' if score >= 0.8 else 'medium'
            result = {
                'compliance_id': f"COMP_{int(time.time())}",
                'type': 'regulatory_compliance',
                'target': context.get('target', 'trading_operations'),
                **{k: v for k, v in comp.items() if k != 'error'},
                'risk_assessment': risk,
                'confidence': 0.9,
                'summary': f"Regulatory status score {score:.2f}",
                'context_updates': {
                    'regulatory_status': 'approved' if score >= 0.7 else 'review',
                    'risk_level': risk
                }
            }
            self.execution_history.append({'timestamp': time.time(), 'action': 'regulatory_compliance', 'result': result})
            return result
        except Exception as e:
            logger.error(f"ComplianceAgent execution failed: {e}")
            return {'error': str(e)}

class RefactorAgent(BaseAgent):
    """RefactorAgent for code optimization and refactoring"""
    
    def __init__(self):
        super().__init__("refactor_agent_001", AgentType.REFACTOR_AGENT)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from backend.providers.refactor_provider import analyze_repository
            analysis = analyze_repository()
            # Crude metrics from outputs
            eslint_issues = int(analysis.get('eslint_issues', 0))
            gas_info = analysis.get('solc_output')
            optimization_score = max(0.5, 1.0 - min(eslint_issues / 100.0, 0.5))
            result = {
                'refactor_id': f"REFACTOR_{int(time.time())}",
                'type': 'code_optimization',
                'target': context.get('target', 'repository'),
                'optimization_score': optimization_score,
                'gas_savings_hint': gas_info[:200] if isinstance(gas_info, str) else None,
                'confidence': 0.8,
                'summary': f"Refactor analysis complete; eslint issues: {eslint_issues}",
                'context_updates': {
                    'optimization_status': 'analyzed',
                    'eslint_issues': eslint_issues
                }
            }
            self.execution_history.append({'timestamp': time.time(), 'action': 'code_refactoring', 'result': result})
            return result
        except Exception as e:
            logger.error(f"RefactorAgent execution failed: {e}")
            return {'error': str(e)}

class MetaAuditor(BaseAgent):
    """MetaAuditor for auditing agent actions and ensuring ESG compliance"""
    
    def __init__(self):
        super().__init__("meta_auditor_001", AgentType.META_AUDITOR)
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            task = context.get('task', {})
            result = context.get('result', {})
            esg_criteria = context.get('esg_criteria', {})
            
            # Simulate ESG compliance audit
            audit_score = self._calculate_esg_score(result, esg_criteria)
            passed = audit_score >= 0.7
            
            audit_result = {
                'audit_id': f"AUDIT_{int(time.time())}",
                'type': 'meta_audit',
                'target': task.get('title', 'unknown'),
                'esg_score': audit_score,
                'compliance_score': audit_score,
                'passed': passed,
                'audit_summary': f'ESG compliance audit {"passed" if passed else "failed"} with score {audit_score:.2f}',
                'recommendations': self._generate_recommendations(audit_score, esg_criteria)
            }
            
            self.execution_history.append({
                'timestamp': time.time(),
                'action': 'meta_audit',
                'result': audit_result
            })
            
            return audit_result
            
        except Exception as e:
            logger.error(f"MetaAuditor execution failed: {e}")
            return {'error': str(e)}
    
    def _calculate_esg_score(self, result: Dict[str, Any], criteria: Dict[str, Any]) -> float:
        """Calculate ESG compliance score"""
        # Simplified scoring logic
        score = 0.8  # Base score
        
        # Adjust based on result characteristics
        if 'environmental' in str(result).lower():
            score += 0.1
        if 'social' in str(result).lower():
            score += 0.05
        if 'governance' in str(result).lower():
            score += 0.05
        
        return min(score, 1.0)
    
    def _generate_recommendations(self, score: float, criteria: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on audit score"""
        recommendations = []
        
        if score < 0.7:
            recommendations.append("Improve environmental impact assessment")
            recommendations.append("Enhance stakeholder engagement")
        if score < 0.8:
            recommendations.append("Strengthen governance transparency")
        
        return recommendations

# === Swarm Protocol Manager ===

class SwarmProtocolManager:
    """Manager for the Swarm Protocol with singleton pattern"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.protocol = SwarmProtocol()
            self.initialized = True
            self.agents_initialized = False
    
    async def initialize_agents(self):
        """Initialize all agents"""
        # Clear existing agents if any
        self.protocol.agents.clear()
        
        agents = [
            BuilderAgent(),
            PermitAgent(),
            SignalAgent(),
            PredictiveAgent(),
            ComplianceAgent(),
            RefactorAgent(),
            MetaAuditor()
        ]
        
        for agent in agents:
            await self.protocol.register_agent(agent)
        
        self.agents_initialized = True
        logger.info(f"Initialized {len(agents)} agents")
    
    async def ensure_agents_initialized(self):
        """Ensure agents are initialized before use"""
        if not self.agents_initialized:
            await self.initialize_agents()
    
    async def create_workflow(self, title: str, description: str, 
                            workflow_type: WorkflowType, agents: List[AgentType],
                            context: Dict[str, Any] = None) -> SwarmTask:
        """Create a new workflow task"""
        await self.ensure_agents_initialized()
        
        task = SwarmTask(
            title=title,
            description=description,
            workflow_type=workflow_type,
            agents=agents,
            context=context or {}
        )
        
        return task
    
    async def execute_workflow(self, task: SwarmTask) -> Dict[str, Any]:
        """Execute a workflow"""
        await self.ensure_agents_initialized()
        return await self.protocol.execute_workflow(task)
    
    async def get_trust_graph(self, agent_type: Optional[AgentType] = None, 
                             limit: int = 100) -> List[Dict[str, Any]]:
        """Get TrustGraph entries"""
        return await self.protocol.get_trust_graph_entries(agent_type, limit)
    
    async def get_workflow_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow status"""
        return await self.protocol.get_workflow_status(task_id)

# Global instance
swarm_manager = SwarmProtocolManager()
