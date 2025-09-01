# Advanced Builder Agent Uniswap + Chainlink + Sentiment Integration

from web3 import Web3
from eth_account import Account
import json
import requests

w3 = Web3(Web3.HTTPProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY"))
private_key = "YOUR_PRIVATE_KEY"
account = Account.from_key(private_key)

CUTF_token = w3.to_checksum_address("YOUR_CUTF_TOKEN_ADDRESS")
WETH_token = w3.to_checksum_address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
uniswap_router_v3 = w3.to_checksum_address("0xE592427A0AEce92De3Edee1F18E0157C05861564")  # Uniswap V3

# Load ABIs
with open("UniswapV3Router.json") as f:
    router_abi = json.load(f)
router_contract = w3.eth.contract(address=uniswap_router_v3, abi=router_abi)

# Chainlink ETH/USD price feed
chainlink_feed = w3.to_checksum_address("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419")
feed_abi = json.loads('[{"inputs":[],"name":"latestAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"}]')
price_feed = w3.eth.contract(address=chainlink_feed, abi=feed_abi)

def get_eth_price():
    price = price_feed.functions.latestAnswer().call()
    return price / 1e8

def alpha_from_sentiment():
    r = requests.get("https://api.tradingview.com/sentiment/BTCUSD")
    data = r.json()
    score = data.get("sentiment_score", 0)
    return score > 0.6

# Dynamic range liquidity (simplified for example)
def provide_range_liquidity(amount_cutftoken, amount_weth, lower_tick, upper_tick):
    tx = router_contract.functions.mint(
        {
            'token0': CUTF_token,
            'token1': WETH_token,
            'fee': 3000,
            'tickLower': lower_tick,
            'tickUpper': upper_tick,
            'amount0Desired': amount_cutftoken,
            'amount1Desired': amount_weth,
            'amount0Min': 0,
            'amount1Min': 0,
            'recipient': account.address,
            'deadline': int(w3.eth.get_block('latest')['timestamp']) + 600
        }
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 500000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Added Uniswap V3 range liquidity: {tx_hash.hex()}")

# Main control
eth_price = get_eth_price()
if alpha_from_sentiment():
    provide_range_liquidity(1000*(10**18), 1*(10**18), -120000, 120000)
    print(f"ETH/USD from Chainlink: ${eth_price}")
