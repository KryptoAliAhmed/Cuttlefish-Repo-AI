import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { MultiDAOOrchestrator } from "./MultiDAOOrchestrator";
import { ethers } from "ethers";
import { Metrics, Experiment } from "./Agent";

const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_PROVIDER_URL || "http://127.0.0.1:8545");
const orchestrator = new MultiDAOOrchestrator(provider, "./deployed.json");

// Define output schema
const orchestratorSchema = z.object({
  action: z.enum([
    "proposeExperiment",
    "createKernelUpdateProposal",
    "createBTCAllocationProposal",
    "mintNFTDeed",
    "voteProposal"
  ]),
  params: z.object({
    daoId: z.string(),
    agentId: z.string().optional(),
    description: z.string().optional(),
    financialKernel: z.number().optional(),
    ecologicalKernel: z.number().optional(),
    socialKernel: z.number().optional(),
    duration: z.number().optional(),
    amountUSD: z.number().optional(),
    tokenURI: z.string().optional(),
    toAddress: z.string().optional(),
    projectedMetrics: z.object({
      financial: z.number(),
      ecological: z.number(),
      social: z.number()
    }).optional(),
    isHighRisk: z.boolean().optional(),
    proposalId: z.number().optional(),
    support: z.boolean().optional()
  })
});

const parser = StructuredOutputParser.fromZodSchema(orchestratorSchema);
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template: `You are an orchestrator assistant for a decentralized multi-DAO regenerative finance system for Small Island Developing States. Parse the user's natural language instruction into a JSON object with fields: action and params. Ensure the output matches the schema provided. If parameters are missing, infer reasonable defaults based on context (e.g., daoId: "AIClusterDAO-Azores", agentId: "agent1", duration: 604800 seconds for 7 days). For kernel updates, ensure weights sum to 100. For experiment proposals, include projectedMetrics and isHighRisk.

{format_instructions}

Examples:
- Input: "Propose a geothermal GPU project in AzoresDAO with 90 ecological and 60 financial scores."
  Output: { "action": "proposeExperiment", "params": { "daoId": "AIClusterDAO-Azores", "agentId": "agent1", "description": "Geothermal GPU project", "projectedMetrics": { "financial": 60, "ecological": 90, "social": 50 }, "isHighRisk": false } }
- Input: "Update ethical kernels in FijiDAO to 50-30-20 for 7 days."
  Output: { "action": "createKernelUpdateProposal", "params": { "daoId": "FijiDAO", "agentId": "agent1", "description": "Update ethical kernels to 50-30-20", "financialKernel": 50, "ecologicalKernel": 30, "socialKernel": 20, "duration": 604800 } }
- Input: "Mint an NFT deed for a coral reef microgrid in BarbadosDAO."
  Output: { "action": "mintNFTDeed", "params": { "daoId": "BarbadosDAO", "toAddress": "0x...", "tokenURI": "ipfs://QmCoralReefMicrogrid" } }
- Input: "Allocate $25,000 to BTC for VanuatuDAO for 30 days."
  Output: { "action": "createBTCAllocationProposal", "params": { "daoId": "VanuatuDAO", "agentId": "agent1", "description": "Allocate $25000 to BTC", "amountUSD": 25000, "duration": 2592000 } }

User Instruction:
{input}`,
  inputVariables: ["input"],
  partialVariables: { format_instructions: formatInstructions }
});

const llm = new ChatOpenAI({ modelName: "gpt-4o", openAIApiKey: process.env.OPENAI_API_KEY });

export async function processUserCommand(naturalLanguage: string, signer: ethers.Signer): Promise<any> {
  try {
    const formattedPrompt = await prompt.format({ input: naturalLanguage });
    const response = await llm.invoke([{ role: "user", content: formattedPrompt }]);
    const structured = await parser.parse(response.content);

    console.log("Parsed LLM output:", structured);

    const agentId = structured.params.agentId || "agent1";
    const daoId = structured.params.daoId || "AIClusterDAO-Azores";

    switch (structured.action) {
      case "proposeExperiment":
        if (!structured.params.description || !structured.params.projectedMetrics) {
          throw new Error("Missing experiment parameters");
        }
        const experiment: Experiment = {
          id: Date.now(),
          description: structured.params.description,
          projectedMetrics: structured.params.projectedMetrics,
          actualMetrics: { financial: 0, ecological: 0, social: 0 },
          verified: false,
          riskBand: structured.params.isHighRisk ? "high" : "normal",
          auditCommitted: false,
          ownerId: agentId,
          daoId: daoId
        };
        return await orchestrator.proposeExperimentInDAO(daoId, orchestrator.getAgent(agentId, daoId), experiment);

      case "createKernelUpdateProposal":
        if (!structured.params.description || !structured.params.financialKernel || !structured.params.ecologicalKernel || !structured.params.socialKernel || !structured.params.duration) {
          throw new Error("Missing kernel update parameters");
        }
        return await orchestrator.proposeNormUpdateOnChain(
          daoId,
          agentId,
          structured.params.description,
          structured.params.financialKernel,
          structured.params.ecologicalKernel,
          structured.params.socialKernel,
          structured.params.duration
        );

      case "createBTCAllocationProposal":
        if (!structured.params.description || !structured.params.amountUSD || !structured.params.duration) {
          throw new Error("Missing BTC allocation parameters");
        }
        return await orchestrator.proposeBTCAllocation(
          daoId,
          agentId,
          structured.params.amountUSD,
          structured.params.duration
        );

      case "mintNFTDeed":
        if (!structured.params.toAddress || !structured.params.tokenURI) {
          throw new Error("Missing NFT mint parameters");
        }
        return await orchestrator.mintNFTDeed(
          daoId,
          structured.params.toAddress,
          structured.params.tokenURI
        );

      case "voteProposal":
        if (structured.params.proposalId === undefined || structured.params.support === undefined) {
          throw new Error("Missing vote parameters");
        }
        return await orchestrator.voteProposal(
          daoId,
          structured.params.proposalId,
          structured.params.support,
          signer
        );

      default:
        throw new Error(`Unknown action: ${structured.action}`);
    }
  } catch (error) {
    console.error("Error processing command:", error);
    throw error;
  }
}