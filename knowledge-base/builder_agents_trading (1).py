# Uniswap Liquidity Pool Deployment Script for Cuttlefish Builder Agents

from web3 import Web3
from eth_account import Account

# Connect to Ethereum node
w3 = Web3(Web3.HTTPProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY"))

# Load private key (safeguard this!)
private_key = "YOUR_PRIVATE_KEY"
account = Account.from_key(private_key)

# Addresses
uniswap_factory = w3.to_checksum_address("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
uniswap_router = w3.to_checksum_address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D")
CUTF_token = w3.to_checksum_address("YOUR_CUTF_TOKEN_ADDRESS")
WETH_token = w3.to_checksum_address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")

# Load Uniswap Router ABI
import json
with open("UniswapV2Router02.json") as f:
    router_abi = json.load(f)
router_contract = w3.eth.contract(address=uniswap_router, abi=router_abi)

# Prepare add liquidity transaction
def add_liquidity(amount_cutftoken, amount_weth):
    tx = router_contract.functions.addLiquidity(
        CUTF_token, WETH_token,
        amount_cutftoken, amount_weth,
        0, 0,
        account.address,
        int(w3.eth.get_block('latest')['timestamp']) + 600
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 300000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Liquidity added. TX hash: {tx_hash.hex()}")

# Example execution
add_liquidity(1000 * (10**18), 1 * (10**18))  # Example: 1000 CUTF + 1 WETH

# Note: ensure CUTF and WETH approvals are done prior on ERC20 approve.
