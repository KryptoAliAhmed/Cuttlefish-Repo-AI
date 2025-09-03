from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
import time
import uuid


@dataclass
class VaultState:
    agent_id: str
    balances: Dict[str, float] = field(default_factory=dict)
    lp_positions: List[Tuple[str, str, float, float]] = field(default_factory=list)  # (tokenA, tokenB, amtA, amtB)


@dataclass
class SimLog:
    timestamp: float
    event: str
    details: Dict[str, object]
    id: str = field(default_factory=lambda: str(uuid.uuid4()))


class TreasurySimulator:
    def __init__(self):
        self.vaults: Dict[str, VaultState] = {}
        self.logs: List[SimLog] = []

    # --- Vault lifecycle ---
    def ensure_vault(self, agent_id: str) -> VaultState:
        if agent_id not in self.vaults:
            self.vaults[agent_id] = VaultState(agent_id=agent_id)
            self._log("vault_created", {"agent_id": agent_id})
        return self.vaults[agent_id]

    def seed_balance(self, agent_id: str, token: str, amount: float) -> None:
        vault = self.ensure_vault(agent_id)
        vault.balances[token] = vault.balances.get(token, 0.0) + amount
        self._log("seed_balance", {"agent_id": agent_id, "token": token, "amount": amount})

    # --- Actions ---
    def add_liquidity(self, agent_id: str, token_a: str, token_b: str, amount_a: float, amount_b: float) -> None:
        vault = self.ensure_vault(agent_id)
        if vault.balances.get(token_a, 0.0) < amount_a:
            raise ValueError("Insufficient tokenA")
        if vault.balances.get(token_b, 0.0) < amount_b:
            raise ValueError("Insufficient tokenB")
        vault.balances[token_a] -= amount_a
        vault.balances[token_b] -= amount_b
        vault.lp_positions.append((token_a, token_b, amount_a, amount_b))
        self._log("add_liquidity", {
            "agent_id": agent_id,
            "tokenA": token_a,
            "tokenB": token_b,
            "amountA": amount_a,
            "amountB": amount_b,
        })

    def remove_liquidity(self, agent_id: str, idx: int) -> Tuple[str, str, float, float]:
        vault = self.ensure_vault(agent_id)
        if idx < 0 or idx >= len(vault.lp_positions):
            raise IndexError("Invalid LP index")
        token_a, token_b, amount_a, amount_b = vault.lp_positions.pop(idx)
        vault.balances[token_a] = vault.balances.get(token_a, 0.0) + amount_a
        vault.balances[token_b] = vault.balances.get(token_b, 0.0) + amount_b
        self._log("remove_liquidity", {
            "agent_id": agent_id,
            "tokenA": token_a,
            "tokenB": token_b,
            "amountA": amount_a,
            "amountB": amount_b,
        })
        return token_a, token_b, amount_a, amount_b

    def swap(self, agent_id: str, token_in: str, token_out: str, amount_in: float, min_out: float = 0.0) -> float:
        vault = self.ensure_vault(agent_id)
        if vault.balances.get(token_in, 0.0) < amount_in:
            raise ValueError("Insufficient tokenIn")
        # naive 1:1 demo swap
        amount_out = amount_in
        if amount_out < min_out:
            raise ValueError("Slippage")
        vault.balances[token_in] -= amount_in
        vault.balances[token_out] = vault.balances.get(token_out, 0.0) + amount_out
        self._log("swap", {
            "agent_id": agent_id,
            "tokenIn": token_in,
            "tokenOut": token_out,
            "amountIn": amount_in,
            "amountOut": amount_out,
        })
        return amount_out

    # --- Signals ---
    def act_on_signal(self, agent_id: str, signal: Dict[str, object]) -> str:
        """Execute a simple policy: if signal type is 'add_lp' or 'swap'."""
        self.ensure_vault(agent_id)
        action = signal.get("action")
        if action == "add_lp":
            self.add_liquidity(
                agent_id,
                str(signal["tokenA"]),
                str(signal["tokenB"]),
                float(signal["amountA"]),
                float(signal["amountB"]),
            )
            return "lp_added"
        elif action == "swap":
            self.swap(
                agent_id,
                str(signal["tokenIn"]),
                str(signal["tokenOut"]),
                float(signal["amountIn"]),
                float(signal.get("minOut", 0.0)),
            )
            return "swapped"
        else:
            self._log("signal_ignored", {"agent_id": agent_id, "signal": signal})
            return "ignored"

    # --- Introspection ---
    def get_vault(self, agent_id: str) -> VaultState:
        return self.ensure_vault(agent_id)

    def get_logs(self, limit: Optional[int] = None) -> List[SimLog]:
        return self.logs[-limit:] if limit else self.logs

    # --- Internal ---
    def _log(self, event: str, details: Dict[str, object]) -> None:
        self.logs.append(SimLog(timestamp=time.time(), event=event, details=details))


# singleton for app usage
simulator = TreasurySimulator()


