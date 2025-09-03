from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from .treasury_sim import simulator
from .builder_agent_core import BuilderAgentCore


router = APIRouter(prefix="/treasury", tags=["treasury"])


class SeedRequest(BaseModel):
    agent_id: str
    token: str
    amount: float


class AddLPRequest(BaseModel):
    agent_id: str
    tokenA: str
    tokenB: str
    amountA: float
    amountB: float


class RemoveLPRequest(BaseModel):
    agent_id: str
    index: int


class SwapRequest(BaseModel):
    agent_id: str
    tokenIn: str
    tokenOut: str
    amountIn: float
    minOut: float = 0.0


class SignalRequest(BaseModel):
    agent_id: str
    signal: Dict[str, Any]


@router.post("/seed")
def seed_balance(req: SeedRequest):
    simulator.seed_balance(req.agent_id, req.token, req.amount)
    return {"ok": True, "vault": simulator.get_vault(req.agent_id)}


@router.post("/lp/add")
def add_lp(req: AddLPRequest):
    try:
        simulator.add_liquidity(req.agent_id, req.tokenA, req.tokenB, req.amountA, req.amountB)
        return {"ok": True, "vault": simulator.get_vault(req.agent_id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/lp/remove")
def remove_lp(req: RemoveLPRequest):
    try:
        data = simulator.remove_liquidity(req.agent_id, req.index)
        return {"ok": True, "removed": data, "vault": simulator.get_vault(req.agent_id)}
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/swap")
def swap(req: SwapRequest):
    try:
        amount_out = simulator.swap(req.agent_id, req.tokenIn, req.tokenOut, req.amountIn, req.minOut)
        return {"ok": True, "amountOut": amount_out, "vault": simulator.get_vault(req.agent_id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signal")
def act_on_signal(req: SignalRequest):
    result = simulator.act_on_signal(req.agent_id, req.signal)
    return {"ok": True, "result": result, "vault": simulator.get_vault(req.agent_id)}


@router.get("/logs")
def get_logs(limit: Optional[int] = None):
    logs = simulator.get_logs(limit)
    return {"ok": True, "logs": [l.__dict__ for l in logs]}


class AgentTickRequest(BaseModel):
    agent_id: str
    opportunities: Optional[list] = None


@router.post("/agent/tick")
def agent_tick(req: AgentTickRequest):
    core = BuilderAgentCore(simulator)
    decision = core.decide({"agent_id": req.agent_id, "opportunities": req.opportunities or []})
    if decision.get("action") in ("add_lp", "swap"):
        simulator.act_on_signal(req.agent_id, decision)
    return {"ok": True, "decision": decision, "vault": simulator.get_vault(req.agent_id)}


@router.get("/vault")
def get_vault(agent_id: str):
    try:
        vault = simulator.get_vault(agent_id)
        return {"ok": True, "vault": {
            "agent_id": vault.agent_id,
            "balances": vault.balances,
            "lp_positions": vault.lp_positions,
        }}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


