// builder_agent.ts - Cuttlefish Builder Agent V0
import { ethers } from "ethers";
import { BuilderAgentWallet__factory } from "./types";
import dotenv from "dotenv";
dotenv.config();

const ALCHEMY_URL = process.env.ALCHEMY_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const AGENT_ID = process.env.AGENT_ID!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const agent = BuilderAgentWallet__factory.connect(CONTRACT_ADDRESS, wallet);

async function simulateAndSubmitProposal(dao: string, calldata: string, threshold = 600) {
  console.log("[Agent] Fetching reputation and simulating proposal...");
  const result = await agent.simulateProposalImpact(dao, threshold);
  console.log("[Simulation]", result);

  if (result.eligible) {
    const tx = await agent.submitProposal(dao, calldata);
    const receipt = await tx.wait();
    console.log("✅ Proposal submitted:", receipt.transactionHash);
  } else {
    console.log("⛔ Proposal simulation failed:", result.message);
  }
}

async function forecastAndInvest(token: string, target: string, protocol = "Aave", apyBP = 500, months = 12, amount = 1000) {
  const forecast = await agent.forecastStakingRewards(token, apyBP, months);
  console.log("[Forecast]", forecast);

  const score = await agent.getReputationScore();
  if (score >= 700) {
    console.log("[Agent] Investing in", protocol);
    const tx = await agent.investInSustainableProtocol(token, amount, protocol, target);
    await tx.wait();
    console.log("✅ Investment complete");
  } else {
    console.log("⛔ Reputation too low to invest:", score);
  }
}

// CLI mode support
const mode = process.argv[2];
if (mode === "submit") {
  simulateAndSubmitProposal(process.argv[3], process.argv[4]);
} else if (mode === "invest") {
  forecastAndInvest(process.argv[3], process.argv[4]);
} else {
  console.log("Usage:");
  console.log("  ts-node builder_agent.ts submit <DAO> <calldata>");
  console.log("  ts-node builder_agent.ts invest <token> <target>");
}
