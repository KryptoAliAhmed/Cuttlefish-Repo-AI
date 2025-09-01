# ✅ CoordinationContract web3.py client for Solidity Coordination Logging

from web3 import Web3
import json

class CoordinationContract:
    def __init__(self, w3: Web3, contract_address: str, abi_path: str, dao_wallet):
        self.w3 = w3
        self.dao_wallet = dao_wallet
        with open(abi_path) as f:
            abi = json.load(f)
        self.contract = self.w3.eth.contract(address=contract_address, abi=abi)

    def _send_tx(self, func, gas=300000):
        gas_price = self.w3.eth.gas_price
        tx = func.build_transaction({
            'from': self.dao_wallet.address,
            'nonce': self.w3.eth.get_transaction_count(self.dao_wallet.address),
            'gas': gas,
            'maxFeePerGas': int(gas_price * 1.2),
            'maxPriorityFeePerGas': int(gas_price * 0.1)
        })
        signed = self.dao_wallet.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"[CoordinationContract]: Sent tx {tx_hash.hex()}")
        return receipt

    def log_alpha(self, agent, asset, confidence):
        func = self.contract.functions.logAlpha(agent, asset, confidence)
        return self._send_tx(func)

    def log_trade(self, agent, asset, amount, price, txHash):
        func = self.contract.functions.logTrade(agent, asset, amount, price, txHash)
        return self._send_tx(func)

    def log_lp_update(self, agent, pool, liquidity, lowerTick, upperTick):
        func = self.contract.functions.logLPUpdate(agent, pool, liquidity, lowerTick, upperTick)
        return self._send_tx(func)

    def require_governance(self, agent, proposalType, summary):
        func = self.contract.functions.requireGovernance(agent, proposalType, summary)
        return self._send_tx(func)
