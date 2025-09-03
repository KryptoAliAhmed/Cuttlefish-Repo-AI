from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from .cognize_agent import CuttlefishCognizeAgent


router = APIRouter(prefix="/cognize", tags=["cognize"])
agent = CuttlefishCognizeAgent()


class CognizeRequest(BaseModel):
    prompt: str


@router.post("/run")
def run_cognize(req: CognizeRequest):
    try:
        result = agent.run(req.prompt)
        return {"ok": True, "result": result.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
def get_logs(limit: Optional[int] = 20):
    return {"ok": True, "entries": agent.load_runs(limit=limit)}


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    item = agent.get_run(run_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "entry": item}


