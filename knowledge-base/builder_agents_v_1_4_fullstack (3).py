# ✅ Embedding multi-chain tool stack + advanced IntelligentBuilderAgent logic

import asyncio
import time
import math
from brownie import accounts

class MultiChainTools:
    def __init__(self, w3_eth, w3_base, w3_arbitrum, carbon_vault_abi, dao_wallet):
        self.w3_eth = w3_eth
        self.w3_base = w3_base
        self.w3_arbitrum = w3_arbitrum
        self.carbon_vault_abi = carbon_vault_abi
        self.dao_wallet = dao_wallet

    def get_carbon_score(self, chain, contract_addr):
        w3 = self._w3(chain)
        contract = w3.eth.contract(address=contract_addr, abi=self.carbon_vault_abi)
        return contract.functions.getOffsetScore(self.dao_wallet.address).call()

    def _w3(self, chain):
        return self.w3_eth if chain=="eth" else (self.w3_base if chain=="base" else self.w3_arbitrum)

class IntelligentBuilderAgent:
    def __init__(self, agent_id, role, tools, coord_contract, message_bus, llm):
        self.agent_id = agent_id
        self.role = role
        self.tools = tools
        self.coord_contract = coord_contract
        self.message_bus = message_bus
        self.llm = llm

    async def run(self):
        while True:
            # simulate getting multi-chain balances & carbon checks
            eth_balance = self.tools.w3_eth.eth.get_balance(self.tools.dao_wallet.address)
            base_balance = self.tools.w3_base.eth.get_balance(self.tools.dao_wallet.address)
            arb_balance = self.tools.w3_arbitrum.eth.get_balance(self.tools.dao_wallet.address)

            carbon_eth = self.tools.get_carbon_score("eth", "0xCarbonVaultEth")
            carbon_base = self.tools.get_carbon_score("base", "0xCarbonVaultBase")
            carbon_arb = self.tools.get_carbon_score("arbitrum", "0xCarbonVaultArb")

            prompt = f"Agent {self.agent_id}: Balances ETH:{eth_balance}, BASE:{base_balance}, ARB:{arb_balance}. "
            prompt += f"Carbon: ETH:{carbon_eth}, BASE:{carbon_base}, ARB:{carbon_arb}. Suggest optimal chain and action."

            decision = await self.llm.invoke(prompt)

            if "eth" in decision.lower():
                self.coord_contract.log_alpha(self.agent_id, "ETH", carbon_eth)
            elif "base" in decision.lower():
                self.coord_contract.log_alpha(self.agent_id, "BASE", carbon_base)
            elif "arb" in decision.lower():
                self.coord_contract.log_alpha(self.agent_id, "ARB", carbon_arb)

            await asyncio.sleep(30)
