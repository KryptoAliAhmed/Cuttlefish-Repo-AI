from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any
from pathlib import Path
import json
import time
import uuid


@dataclass
class CognizeResult:
    run_id: str
    prompt: str
    fast_response: str
    deep_blueprint: Dict[str, Any]
    created_at: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "prompt": self.prompt,
            "fast_response": self.fast_response,
            "deep_blueprint": self.deep_blueprint,
            "created_at": self.created_at,
        }


class CuttlefishCognizeAgent:
    """Hybrid reasoning scaffold with fast+deep layers (demo-only)."""

    def __init__(self):
        repo_root = Path(__file__).resolve().parents[1]
        self.trust_dir = repo_root / "json-logs" / "trustgraph"
        self.trust_dir.mkdir(parents=True, exist_ok=True)
        self.trust_file = self.trust_dir / "cognize.jsonl"

    # --- Layers ---
    def fast_layer(self, prompt: str) -> str:
        # Fast, shallow response (simulate Gemini/Grok-style)
        prompt_preview = prompt.strip().split("\n")[0][:160]
        return f"Quick take: {prompt_preview} ... [auto]"

    def deep_layer(self, prompt: str) -> Dict[str, Any]:
        # Deep, structured plan (simulate Qwen3/CollabLLM-style chain)
        return {
            "objective": "Synthesize blueprint from prompt",
            "steps": [
                {"id": 1, "action": "analyze_context", "notes": "Extract entities, constraints"},
                {"id": 2, "action": "decompose_goals", "notes": "Map to subgoals and tasks"},
                {"id": 3, "action": "propose_plan", "notes": "Generate staged blueprint"},
                {"id": 4, "action": "risk_ethics_check", "notes": "Flag ethical/risk concerns"},
            ],
            "artifacts": {
                "blueprint_summary": "Draft blueprint with milestones, dependencies, and evaluation hooks."
            },
        }

    def run(self, prompt: str) -> CognizeResult:
        fast = self.fast_layer(prompt)
        deep = self.deep_layer(prompt)
        result = CognizeResult(
            run_id=str(uuid.uuid4()),
            prompt=prompt,
            fast_response=fast,
            deep_blueprint=deep,
            created_at=time.time(),
        )
        self._append_to_trustgraph(result)
        return result

    # --- TrustGraph JSON emission ---
    def _append_to_trustgraph(self, result: CognizeResult) -> None:
        entry = {
            "type": "cognize_run",
            "payload": result.to_dict(),
            "timestamp": result.created_at,
        }
        with self.trust_file.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

    def load_runs(self, limit: int = 20) -> list[dict]:
        if not self.trust_file.exists():
            return []
        lines = self.trust_file.read_text(encoding="utf-8").strip().splitlines()
        out = []
        for line in lines[-limit:]:
            try:
                out.append(json.loads(line))
            except Exception:
                continue
        return out

    def get_run(self, run_id: str) -> dict | None:
        for item in reversed(self.load_runs(limit=1000)):
            payload = item.get("payload", {})
            if payload.get("run_id") == run_id:
                return item
        return None


