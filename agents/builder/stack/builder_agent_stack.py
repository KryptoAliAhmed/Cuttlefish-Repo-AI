# From: backend/cuttlefish_collective_backend_stack.py

import random

# --- Agent Classes ---

class TradeSignalMarket:
    """
    Simulates real-time market data and generates actionable trade/resource allocation signals.
    This agent generates signals for the BuilderAgent, influencing its decisions on crypto trading,
    liquidity provision, and resource allocation.
    """
    def get_signal(self, current_context=""):
        signals = [
            "OPTIMIZE_LIQUIDITY_PROVISION: Market low volatility. Suggest adding liquidity to USDC-ETH pool.",
            "WITHDRAW_LIQUIDITY: High impermanent loss risk. Recommend withdrawing 50% from volatile pool.",
            "ARBITRAGE_OPPORTUNITY: Price discrepancy detected. Execute cross-exchange crypto trade.",
            "ALLOCATE_TREASURY_ASSETS: Yield farming opportunity found. Move 100k USD to stablecoin farm.",
            "REBALANCE_LP_TOKENS: Pool imbalance. Adjust token ratios in existing LP."
        ]
        chosen_signal = random.choice(signals)
        return chosen_signal

class BuilderAgent:
    """
    The autonomous execution layer managing capital, resources, and deployments.
    This agent receives signals from the TradeSignalMarket and blueprints from the BlueprintPlanner.
    It makes financial decisions related to crypto trading, managing the CuttlefishVault,
    and strategically building/managing liquidity pools.
    """
    def __init__(self, trust_graph, trade_signal_market):
        self.trust_graph = trust_graph
        self.trade_signal_market = trade_signal_market
        self.vault_balance = 1000000.0  # Simulated initial capital for CuttlefishVault

    def run(self, blueprint_content, blueprint_node_id):
        """
        Takes a blueprint and simulates the BuilderAgent's financial and deployment actions,
        including crypto trading and liquidity management.
        """
        signal = self.trade_signal_market.get_signal(current_context=blueprint_content)

        action_decision = f"BuilderAgent Decision: Based on blueprint '{blueprint_content[:30]}...' and signal '{signal[:50]}...', will initiate crypto trading and liquidity operations."

        amount = 0.0
        if "LIQUIDITY_PROVISION" in signal:
            amount = round(random.uniform(50000.0, 200000.0), 2)
            self.vault_balance -= amount
            action_decision += f" Executed simulated liquidity provision of ${amount:.2f}. New vault balance: ${self.vault_balance:.2f}."
        elif "WITHDRAW_LIQUIDITY" in signal:
            amount = round(random.uniform(25000.0, 100000.0), 2)
            self.vault_balance += amount
            action_decision += f" Executed simulated liquidity withdrawal of ${amount:.2f}. New vault balance: ${self.vault_balance:.2f}."
        elif "ARBITRAGE_OPPORTUNITY" in signal or "ALLOCATE_TREASURY_ASSETS" in signal:
            amount = round(random.uniform(10000.0, 75000.0), 2)
            profit_loss = round(random.uniform(-0.05, 0.10) * amount, 2)
            self.vault_balance += profit_loss
            action_decision += f" Executed simulated crypto trade. P/L: ${profit_loss:.2f}. New vault balance: ${self.vault_balance:.2f}."

        # Add BuilderAgent's action as a node in the TrustGraph
        action_node_id, action_node = self.trust_graph.add_node(
            action_decision,
            "builder_agent_action",
            metadata={"current_vault_balance": self.vault_balance, "signal_acted_on": signal}
        )
        self.trust_graph.add_edge(blueprint_node_id, action_node_id, "executed_by_builder_agent")

        return action_node_id, action_node['content']
