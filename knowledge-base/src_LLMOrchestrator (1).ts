import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
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
    "voteProposal",
    "getKernels",
    "getProposalDetails"
  ]),
  params: z.object({
    daoId: z.string().optional(),
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
  template: `You are an orchestrator assistant for a decentralized multi-DAO regenerative finance system for Small Island Developing States. Parse the user's natural language instruction into a JSON object with fields: action and params. Use the conversation history to infer missing parameters (e.g., daoId, agentId, proposalId). If parameters are missing, use defaults (daoId: "AIClusterDAO-Azores", agentId: "agent1", duration: 604800 seconds). For kernel updates, ensure weights sum to 100. For queries, retrieve relevant data (e.g., kernel weights, proposal details).

{format_instructions}

Conversation History:
{history}

User Instruction:
{input}`,
  inputVariables: ["input", "history"],
  partialVariables: { format_instructions: formatInstructions }
});

const llm = new ChatOpenAI({ modelName: "gpt-4o", openAIApiKey: process.env.OPENAI_API_KEY });
const memory = new BufferMemory({ memoryKey: "history", inputKey: "input" });
const chain = new ConversationChain({ llm, prompt, memory });

export async function processUserCommand(naturalLanguage: string, signer?: ethers.Signer): Promise<any> {
  try {
    const response = await chain.call({ input: naturalLanguage });
    const structured = await parser.parse(response.response);

    console.log("Parsed LLM output:", structured);

    const daoId = structured.params.daoId || "AIClusterDAO-Azores";
    const agentId = structured.params.agentId || "agent1";

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
        if (!signer) throw new Error("Signer required");
        const kernelTx = await orchestrator.proposeNormUpdateOnChain(
          daoId,
          agentId,
          structured.params.description,
          structured.params.financialKernel,
          structured.params.ecologicalKernel,
          structured.params.socialKernel,
          structured.params.duration,
          signer
        );
        memory.saveContext(
          { input: naturalLanguage },
          { output: JSON.stringify({ proposalId: kernelTx.logs[0].args[0], daoId }) }
        );
        return kernelTx;

      case "createBTCAllocationProposal":
        if (!structured.params.description || !structured.params.amountUSD || !structured.params.duration) {
          throw new Error("Missing BTC allocation parameters");
        }
        if (!signer) throw new Error("Signer required");
        const btcTx = await orchestrator.proposeBTCAllocation(
          daoId,
          agentId,
          structured.params.amountUSD,
          structured.params.duration,
          signer
        );
        memory.saveContext(
          { input: naturalLanguage },
          { output: JSON.stringify({ proposalId: btcTx.logs[0].args[0], daoId }) }
        );
        return btcTx;

      case "mintNFTDeed":
        if (!structured.params.toAddress || !structured.params.tokenURI) {
          throw new Error("Missing NFT mint parameters");
        }
        if (!signer) throw new Error("Signer required");
        return await orchestrator.mintNFTDeed(daoId, structured.params.toAddress, structured.params.tokenURI, signer);

      case "voteProposal":
        if (structured.params.proposalId === undefined || structured.params.support === undefined) {
          throw new Error("Missing vote parameters");
        }
        if (!signer) throw new Error("Signer required");
        return await orchestrator.voteProposal(daoId, structured.params.proposalId, structured.params.support, signer);

      case "getKernels":
        return await orchestrator.getEthicalKernels(daoId);

      case "getProposalDetails":
        if (structured.params.proposalId === undefined) {
          throw new Error("Missing proposal ID");
        }
        return await orchestrator.getProposalDetails(daoId, structured.params.proposalId);

      default:
        throw new Error(`Unknown action: ${structured.action}`);
    }
  } catch (error) {
    console.error("Error processing command:", error);
    throw error;
  }
}

export async function clearConversationHistory(): Promise<void> {
  await memory.clear();
  console.log("Conversation history cleared");
}