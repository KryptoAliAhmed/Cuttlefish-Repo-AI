import os
import json
import time
from web3 import Web3
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

INFURA_URL = os.getenv("INFURA_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("DAO_CONTRACT_ADDRESS")
STABLE_TOKEN_ADDRESS = os.getenv("STABLE_TOKEN_ADDRESS")

# Basic validation
if not all([INFURA_URL, PRIVATE_KEY, CONTRACT_ADDRESS, STABLE_TOKEN_ADDRESS]):
    print("⛔ Error: Missing environment variables. Check your .env file.")
    exit(1)

# Load contract ABIs
with open("./artifacts/contracts/SovereignWealthDAO.sol/SovereignWealthDAO.json") as f:
    dao_abi = json.load()["abi"]
with open("./artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json") as f:
    erc20_abi = json.load()["abi"]

# Setup web3 & contract instances
web3 = Web3(Web3.HTTPProvider(INFURA_URL))
account = web3.eth.account.from_key(PRIVATE_KEY)
dao_contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=dao_abi)
token_contract = web3.eth.contract(address=STABLE_TOKEN_ADDRESS, abi=erc20_abi)

print(f"✨ Connected to network: {web3.net.version}")
print(f"🦊 Agent Wallet Address: {account.address}")
print(f"📜 DAO Contract Address: {CONTRACT_ADDRESS}")

# --- UTILITY ---
def build_and_send_tx(function):
    """Builds, signs, and sends a transaction."""
    try:
        nonce = web3.eth.get_transaction_count(account.address)
        gas_price = web3.eth.gas_price
        
        tx = function.build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,  # Generous gas limit
            'gasPrice': gas_price,
        })
        
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"[Transaction] Sent: {web3.to_hex(tx_hash)}")
        print("[Transaction] Waiting for receipt...")
        
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        print(f"✅ Transaction confirmed in block: {receipt.blockNumber}")
        return receipt
    except Exception as e:
        print(f"❌ Transaction failed: {e}")
        return None

# --- AGENT LOGIC ---
def check_dao_status():
    """Fetches and prints the current status of the DAO."""
    print("\n--- 📊 Checking DAO Status ---")
    balance_wei = token_contract.functions.balanceOf(CONTRACT_ADDRESS).call()
    total_contributed_wei = dao_contract.functions.totalContributed().call()
    available_wei = dao_contract.functions.currentAvailableForDistribution().call()
    min_reserve_wei = dao_contract.functions.currentMinReserve().call()

    print(f"  - DAO Balance: {web3.from_wei(balance_wei, 'ether')} USDC")
    print(f"  - Total Contributed: {web3.from_wei(total_contributed_wei, 'ether')} USDC")
    print(f"  - Minimum Reserve: {web3.from_wei(min_reserve_wei, 'ether')} USDC")
    print(f"  - Available for Distribution: {web3.from_wei(available_wei, 'ether')} USDC")

def contribute_to_dao(amount_ether):
    """Contributes a specified amount of stablecoins to the DAO."""
    print(f"\n--- 💸 Contributing {amount_ether} USDC to DAO ---")
    amount_wei = web3.to_wei(amount_ether, 'ether')

    # 1. Approve the DAO to spend our tokens
    print("[Step 1/2] Approving token transfer...")
    approve_function = token_contract.functions.approve(CONTRACT_ADDRESS, amount_wei)
    if not build_and_send_tx(approve_function):
        return

    # 2. Contribute the approved tokens
    print("[Step 2/2] Contributing funds...")
    contribute_function = dao_contract.functions.contribute(amount_wei)
    build_and_send_tx(contribute_function)

def approve_and_fund_project(project_address, amount_ether):
    """Approves a project and releases funds to it."""
    print(f"\n--- 🏗️  Funding Project {project_address} with {amount_ether} USDC ---")
    amount_wei = web3.to_wei(amount_ether, 'ether')

    # 1. Approve the project
    print("[Step 1/2] Approving project...")
    approve_function = dao_contract.functions.approveProject(project_address)
    if not build_and_send_tx(approve_function):
        return

    # 2. Release funds
    print("[Step 2/2] Releasing funds...")
    release_function = dao_contract.functions.releaseFundsToProject(project_address, amount_wei)
    build_and_send_tx(release_function)

# --- USAGE EXAMPLE ---
if __name__ == "__main__":
    # Example workflow
    check_dao_status()
    
    # Uncomment to run actions
    # contribute_to_dao(1000) # Contribute 1000 USDC
    # check_dao_status()
    
    # project_to_fund = "0x..." # Replace with a real project address
    # approve_and_fund_project(project_to_fund, 500) # Fund with 500 USDC
    # check_dao_status()
