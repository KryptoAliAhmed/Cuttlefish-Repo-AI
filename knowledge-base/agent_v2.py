import os
import json
import time
from web3 import Web3
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

INFURA_URL = os.getenv("INFURA_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
AGENT_WALLET_CONTRACT_ADDRESS = os.getenv("AGENT_WALLET_CONTRACT_ADDRESS")
TOKEN_ADDRESS = os.getenv("STABLE_TOKEN_ADDRESS")
DAO_ADDRESS = os.getenv("DAO_CONTRACT_ADDRESS") # Example DAO for proposals

# Basic validation
if not all([INFURA_URL, PRIVATE_KEY, AGENT_WALLET_CONTRACT_ADDRESS, TOKEN_ADDRESS, DAO_ADDRESS]):
    print("⛔ Error: Missing environment variables. Check your .env file for the V2 agent.")
    exit(1)

# Load contract ABIs
try:
    with open("./artifacts/contracts/BuilderAgentWallet.sol/BuilderAgentWallet.json") as f:
        agent_wallet_abi = json.load()["abi"]
    with open("./artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json") as f:
        erc20_abi = json.load()["abi"]
except FileNotFoundError as e:
    print(f"❌ ABI file not found. Please compile the contracts first using 'npx hardhat compile'. Error: \{e\}")
    exit(1)


# Setup web3 & contract instances
web3 = Web3(Web3.HTTPProvider(INFURA_URL))
account = web3.eth.account.from_key(PRIVATE_KEY)
agent_wallet = web3.eth.contract(address=AGENT_WALLET_CONTRACT_ADDRESS, abi=agent_wallet_abi)
token_contract = web3.eth.contract(address=TOKEN_ADDRESS, abi=erc20_abi)

print(f"✨ Connected to network: \{web3.net.version\}")
print(f"🦊 Agent Wallet Address (EOA): \{account.address\}")
print(f"📜 BuilderAgentWallet Contract: \{AGENT_WALLET_CONTRACT_ADDRESS\}")

# --- UTILITY ---
def build_and_send_tx(function):
    """Builds, signs, and sends a transaction."""
    try:
        nonce = web3.eth.get_transaction_count(account.address)
        gas_price = web3.eth.gas_price
        
        tx = function.build_transaction(\{
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': gas_price
        \})
        
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"[Transaction] Sent: \{web3.to_hex(tx_hash)\}")
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        print(f"✅ Confirmed in block: \{receipt.blockNumber\}")
        return receipt
    except Exception as e:
        print(f"❌ Transaction failed: \{e\}")
        return None

# --- AGENT LOGIC ---

def check_status_and_forecast():
    """Checks wallet holdings and forecasts staking rewards."""
    print("\n--- 📊 Checking Agent Wallet Status & Forecasting ---")
    try:
        # Check ERC20 balance within the agent wallet
        balance_wei = agent_wallet.functions.getERC20Balance(TOKEN_ADDRESS).call()
        balance_ether = web3.from_wei(balance_wei, 'ether')
        print(f"  - Wallet Holdings: \{balance_ether\} USDC")

        # Forecast staking rewards based on current holdings
        if balance_wei > 0:
            forecast = agent_wallet.functions.forecastStakingRewards(balance_wei, 365).call()
            reward_ether = web3.from_wei(forecast[0], 'ether')
            multiplier = forecast[1] / 100.0
            print(f"  - Forecast (1yr): \{reward_ether:.4f\} USDC reward (Multiplier: \{multiplier\}x)")
        else:
            print("  - No holdings to forecast rewards for.")
            
        reputation = agent_wallet.functions.getAgentReputation().call()
        print(f"  - Agent Reputation: \{reputation\}")

    except Exception as e:
        print(f"❌ Error checking status: \{e\}")

def simulate_and_submit_proposal(description, calldata_str):
    """Simulates and, if eligible, submits a DAO proposal."""
    print("\n--- 🏛️  Simulating & Submitting DAO Proposal ---")
    try:
        # 1. Simulate the proposal impact
        calldata_bytes = calldata_str.encode('utf-8')
        sim = agent_wallet.functions.simulateProposalImpact(description, calldata_bytes).call()
        
        is_approved = sim[0]
        estimated_impact = sim[1]
        reason = sim[3]
        
        print(f"  - Simulation Result: Approved=\{is_approved\}, Impact=\{estimated_impact\}, Reason='\{reason\}'")

        # 2. Submit if the simulation was approved
        if is_approved:
            print("  - ✅ Simulation approved. Submitting proposal...")
            submit_function = agent_wallet.functions.submitDAOProposal(description, calldata_bytes)
            build_and_send_tx(submit_function)
        else:
            print("  - ⛔ Simulation failed. Proposal not submitted.")

    except Exception as e:
        print(f"❌ Error during proposal process: \{e\}")

def deposit_tokens_to_agent_wallet(amount_ether):
    """Deposits tokens from the EOA to the BuilderAgentWallet contract."""
    print(f"\n--- 📥 Depositing \{amount_ether\} USDC to Agent Wallet ---")
    try:
        amount_wei = web3.to_wei(amount_ether, 'ether')
        
        # 1. Approve the agent wallet to spend tokens
        print("  - [Step 1/2] Approving token transfer...")
        approve_function = token_contract.functions.approve(AGENT_WALLET_CONTRACT_ADDRESS, amount_wei)
        if not build_and_send_tx(approve_function):
            return

        # 2. Deposit the tokens into the agent wallet
        print("  - [Step 2/2] Depositing funds...")
        deposit_function = agent_wallet.functions.depositERC20(TOKEN_ADDRESS, amount_wei)
        build_and_send_tx(deposit_function)
    except Exception as e:
        print(f"❌ Error during token deposit: \{e\}")

# --- MAIN AGENT LOOP ---
if __name__ == "__main__":
    # Example: Deposit 1000 tokens to get started (run this once)
    # deposit_tokens_to_agent_wallet(1000)

    while True:
        print("\n" + "="*50)
        print(f"[\{time.ctime()\}] Running agent cycle...")
        
        # 1. Check status and forecast rewards
        check_status_and_forecast()
        
        # 2. Simulate and potentially submit a proposal
        proposal_description = "Proposal to allocate funds for new research initiative"
        proposal_calldata = "0xdeadbeef" # Example calldata
        simulate_and_submit_proposal(proposal_description, proposal_calldata)
        
        print("="*50)
        print(f"Cycle complete. Waiting for 1 hour...")
        time.sleep(3600)
