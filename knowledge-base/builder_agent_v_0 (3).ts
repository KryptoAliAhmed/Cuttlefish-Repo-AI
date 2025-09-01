// builder_agent.ts - Cuttlefish Builder Agent V0 (Improved)
import { ethers, BigNumber } from "ethers";
import { BuilderAgentWallet__factory } from "./types";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// --- Configuration from Environment Variables ---
const ALCHEMY_URL = process.env.ALCHEMY_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const DEFAULT_GAS_BUFFER_PERCENT = parseInt(process.env.DEFAULT_GAS_BUFFER_PERCENT || "20", 10); // Default to 20% buffer

// Basic validation for environment variables
if (!ALCHEMY_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error("⛔ Error: Missing one or more environment variables (ALCHEMY_URL, PRIVATE_KEY, CONTRACT_ADDRESS).");
  console.error("Please ensure your .env file is correctly configured.");
  process.exit(1);
}

// --- Ethers.js Setup ---
const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const agent = BuilderAgentWallet__factory.connect(CONTRACT_ADDRESS, wallet);

console.log(`✨ Connected to network: ${provider.network.name} (Chain ID: ${provider.network.chainId})`);
console.log(`🦊 Agent Wallet Address: ${wallet.address}`);
console.log(`📜 BuilderAgentWallet Contract Address: ${CONTRACT_ADDRESS}`);

// --- Helper for Gas Estimation ---
async function getGasLimit(txFunction: () => Promise<BigNumber>): Promise<BigNumber> {
    try {
        const estimatedGas = await txFunction();
        // Add a buffer to the estimated gas
        return estimatedGas.mul(100 + DEFAULT_GAS_BUFFER_PERCENT).div(100);
    } catch (error) {
        console.warn("⚠️ Warning: Failed to estimate gas. Using a higher default gas limit. Error:", error);
        // Fallback to a generous default if estimation fails
        return BigNumber.from(500000);
    }
}

// --- Agent Functions ---

/**
 * Simulates a proposal impact and submits it if eligible.
 * @param dao The address of the DAO contract.
 * @param calldata The hex string representing the proposal's calldata.
 * @param threshold The minimum reputation score required.
 */
async function simulateAndSubmitProposal(dao: string, calldata: string, threshold: number = 600) {
  console.log(`\n--- Simulating and Submitting Proposal ---`);
  console.log(`DAO: ${dao}`);
  console.log(`Calldata: ${calldata}`);
  console.log(`Reputation Threshold: ${threshold}`);

  // Input validation
  if (!ethers.utils.isAddress(dao)) {
    console.error("⛔ Invalid DAO address provided.");
    return;
  }
  if (!ethers.utils.isHexString(calldata) || calldata.length < 3) { // Minimum 0x + 1 char
    console.error("⛔ Invalid calldata provided. Must be a hex string (e.g., 0x...).");
    return;
  }
  if (threshold < 0 || threshold > 1000) {
    console.error("⛔ Reputation threshold must be between 0 and 1000.");
    return;
  }

  try {
    console.log("[Agent] Fetching reputation and simulating proposal...");
    const result = await agent.simulateProposalImpact(dao, threshold);
    console.log("[Simulation Result]", `Eligible: ${result.eligible}, Score: ${result.score.toString()}, Message: ${result.message}`);

    if (result.eligible) {
      console.log("✅ Simulation passed. Submitting proposal...");
      
      const gasLimit = await getGasLimit(() => agent.estimateGas.submitProposal(dao, calldata));

      const tx = await agent.submitProposal(dao, calldata, { gasLimit });
      console.log(`[Transaction] Sending proposal transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log("✅ Proposal submitted. Transaction Hash:", receipt.transactionHash);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    } else {
      console.log("⛔ Proposal simulation failed:", result.message);
    }
  } catch (error: any) {
    console.error("❌ An error occurred during proposal simulation or submission:");
    if (error.reason) {
        console.error("  Revert Reason:", error.reason);
    } else if (error.message) {
        console.error("  Error Message:", error.message);
    } else {
        console.error("  ", error);
    }
  }
}

/**
 * Forecasts staking rewards and invests if reputation is sufficient.
 * @param token The address of the ERC20 token to invest.
 * @param targetContract The address of the target protocol contract (e.g., Aave lending pool).
 * @param protocolName The name of the target protocol (for logging).
 * @param apyBP Annual Percentage Yield in Basis Points (e.g., 500 for 5%).
 * @param months Duration of staking in months.
 * @param amount The amount of tokens to invest (as a human-readable number, e.g., 1000).
 * This will be converted to the token's smallest unit (Wei for ETH, or based on ERC20 decimals).
 */
async function forecastAndInvest(
  token: string,
  targetContract: string,
  protocolName: string = "Aave",
  apyBP: number = 500,
  months: number = 12,
  amount: number = 1000
) {
  console.log(`\n--- Forecasting and Investing ---`);
  console.log(`Token: ${token}`);
  console.log(`Target Contract: ${targetContract}`);
  console.log(`Protocol: ${protocolName}`);
  console.log(`APY (BP): ${apyBP}`);
  console.log(`Months: ${months}`);
  console.log(`Amount (Human-readable): ${amount}`);

  // Input validation
  if (!ethers.utils.isAddress(token)) {
    console.error("⛔ Invalid token address provided.");
    return;
  }
  if (!ethers.utils.isAddress(targetContract)) {
    console.error("⛔ Invalid target contract address provided.");
    return;
  }
  if (months <= 0 || months > 120) {
    console.error("⛔ Invalid duration: 1-120 months.");
    return;
  }
  if (apyBP < 0 || apyBP > 10000) { // Assuming 0-100%
      console.error("⛔ Invalid APY: 0-10000 basis points (0-100%).");
      return;
  }
  if (amount <= 0) {
      console.error("⛔ Investment amount must be greater than zero.");
      return;
  }
  if (protocolName.length === 0 || protocolName.length > 100) {
    console.error("⛔ Invalid protocol name length (1-100 characters).");
    return;
  }

  try {
    console.log("[Agent] Forecasting staking rewards...");
    const forecast = await agent.forecastStakingRewards(token, apyBP, months);
    console.log("[Staking Forecast]", `Projected Reward: ${forecast.projectedReward.toString()} (raw units), Message: ${forecast.message}`);

    console.log("[Agent] Fetching current reputation score...");
    const score = await agent.getReputationScore();
    console.log("[Agent] Current Reputation Score:", score.toString());

    if (score.gte(700)) { 
      console.log(`✅ Reputation sufficient (${score.toString()}). Proceeding with investment.`);
      const amountInTokenUnits = ethers.BigNumber.from(amount); 
      console.log(`Converting human-readable amount (${amount}) to token's raw units: ${amountInTokenUnits.toString()}`);

      const gasLimit = await getGasLimit(() => agent.estimateGas.investInSustainableProtocol(
        token, amountInTokenUnits, protocolName, targetContract
      ));

      console.log(`[Transaction] Investing ${amount} into ${protocolName} via ${targetContract}...`);
      const tx = await agent.investInSustainableProtocol(token, amountInTokenUnits, protocolName, targetContract, { gasLimit });
      console.log(`[Transaction] Sending investment transaction: ${tx.hash}`);
      await tx.wait();
      console.log("✅ Investment complete.");
    } else {
      console.log("⛔ Reputation too low to invest. Required: 700, Current:", score.toString());
    }
  } catch (error: any) {
    console.error("❌ An error occurred during staking forecast or investment:");
    if (error.reason) {
        console.error("  Revert Reason:", error.reason);
    } else if (error.message) {
        console.error("  Error Message:", error.message);
    } else {
        console.error("  ", error);
    }
  }
}

// --- CLI Mode Support ---
const args = process.argv.slice(2);
const mode = args[0];

if (!mode) {
  console.log("\n--- Cuttlefish Builder Agent CLI ---");
  console.log("Usage:");
  console.log("  ts-node builder_agent.ts submit <DAO_Address> <Calldata_Hex> [Reputation_Threshold_Optional]");
  console.log("  ts-node builder_agent.ts invest <Token_Address> <Target_Contract_Address> [Protocol_Name] [APY_BP] [Months] [Amount]");
  process.exit(0);
}

(async () => {
  if (mode === "submit") {
    const dao = args[1];
    const calldata = args[2];
    const threshold = args[3] ? parseInt(args[3], 10) : undefined;

    if (!dao || !calldata) {
        console.error("⛔ Missing arguments for 'submit' mode.");
        process.exit(1);
    }
    await simulateAndSubmitProposal(dao, calldata, threshold);

  } else if (mode === "invest") {
    const token = args[1];
    const target = args[2];
    const protocol = args[3];
    const apyBP = args[4] ? parseInt(args[4], 10) : undefined;
    const months = args[5] ? parseInt(args[5], 10) : undefined;
    const amount = args[6] ? parseFloat(args[6]) : undefined;

    if (!token || !target) {
        console.error("⛔ Missing arguments for 'invest' mode.");
        process.exit(1);
    }
    await forecastAndInvest(token, target, protocol, apyBP, months, amount);

  } else {
    console.error(`⛔ Unknown mode: "${mode}"`);
    process.exit(1);
  }
})();
