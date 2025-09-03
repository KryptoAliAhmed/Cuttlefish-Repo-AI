from __future__ import annotations

from typing import Dict, Any, List
import random

from .treasury_sim import TreasurySimulator


class BuilderAgentCore:
    """Minimal decision engine that turns simplistic signals into treasury actions."""

    def __init__(self, simulator: TreasurySimulator):
        self.simulator = simulator

    def decide(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Given a context with market "opportunities" and balances, choose an action.
        Demo policy:
          - If an opportunity exists, prefer adding LP with small size.
          - Otherwise randomly swap between two tokens if balance allows.
        """
        agent_id = str(context.get("agent_id", "demo-agent"))
        opportunities: List[Dict[str, Any]] = context.get("opportunities", [])

        # Ensure vault exists
        self.simulator.ensure_vault(agent_id)

        # Try LP if opportunity present
        if opportunities:
            opp = opportunities[0]
            token_a = str(opp.get("tokenA", "USDC"))
            token_b = str(opp.get("tokenB", "WETH"))
            balances = self.simulator.get_vault(agent_id).balances
            amt_a = min(10.0, balances.get(token_a, 0.0))
            amt_b = min(10.0, balances.get(token_b, 0.0))
            if amt_a > 0 and amt_b > 0:
                return {
                    "action": "add_lp",
                    "tokenA": token_a,
                    "tokenB": token_b,
                    "amountA": amt_a,
                    "amountB": amt_b,
                }

        # Fallback: try a small swap if any balance exists
        balances = self.simulator.get_vault(agent_id).balances
        tokens = [t for t, b in balances.items() if b > 1.0]
        if len(tokens) >= 2:
            token_in = tokens[0]
            token_out = tokens[1]
            return {
                "action": "swap",
                "tokenIn": token_in,
                "tokenOut": token_out,
                "amountIn": 1.0,
                "minOut": 0.0,
            }

        return {"action": "hold"}


