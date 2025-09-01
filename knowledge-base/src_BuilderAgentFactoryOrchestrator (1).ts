import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { z } from "zod";
import * as fs from "fs";
import { processUserCommand } from "./LLMOrchestrator";

const llm = new ChatOpenAI({ modelName: "gpt-4o", openAIApiKey: process.env.OPENAI_API_KEY });
const memory = new BufferMemory({ memoryKey: "history", inputKey: "input" });

// Schema for factory tasks
const factorySchema = z.object({
  task: z.enum(["plan", "execute", "verify", "enforceStyle"]),
  params: z.object({
    userInput: z.string(),
    planPath: z.string().optional(),
    codePath: z.string().optional(),
    contractName: z.string().optional(),
    errorMessage: z.string().optional(),
    styleRules: z.array(z.string()).optional()
  })
});

const parser = StructuredOutputParser.fromZodSchema(factorySchema);
const formatInstructions = parser.getFormatInstructions();

// Planning Agent Prompt
const planningPrompt = new PromptTemplate({
  template: `You are a Planning Agent for the Builder Agent Factory. Generate a detailed plan for the task based on the user input and conversation history. Use the template in prompts/{task}-plan.md if available. Ensure the plan is comprehensive, addressing all steps needed for execution and verification.

Conversation History:
{history}

User Input:
{input}

{format_instructions}`,
  inputVariables: ["input", "history"],
  partialVariables: { format_instructions: formatInstructions }
});

// Execution Agent Prompt
const executionPrompt = new PromptTemplate({
  template: `You are an Execution Agent. Based on the provided plan, generate or modify code to complete the task. Ensure adherence to best practices (e.g., OpenZeppelin for Solidity, Airbnb for TypeScript). Output the code and a granular commit message.

Plan:
{plan}

Conversation History:
{history}

User Input:
{input}

{format_instructions}`,
  inputVariables: ["plan", "input", "history"],
  partialVariables: { format_instructions: formatInstructions }
});

// Verification Agent Prompt
const verificationPrompt = new PromptTemplate({
  template: `You are a Verification Agent. Validate the generated code against the plan, original requirements, and best practices. Check for functional correctness, security, and adherence to style rules. Output a verification report.

Plan:
{plan}

Generated Code:
{code}

Conversation History:
{history}

User Input:
{input}

Output a JSON verification report.`,
  inputVariables: ["plan", "code", "input", "history"]
});

// Style Enforcer Agent Prompt
const styleEnforcerPrompt = new PromptTemplate({
  template: `You are a Style Enforcer Agent. Ensure the provided code adheres to specified style rules (e.g., Solidity: camelCase variables, TypeScript: Airbnb style). Fix any violations and output the corrected code with a commit message.

Code:
{code}

Style Rules:
{style_rules}

Conversation History:
{history}

User Input:
{input}

{format_instructions}`,
  inputVariables: ["code", "style_rules", "input", "history"],
  partialVariables: { format_instructions: formatInstructions }
});

const planningChain = new ConversationChain({ llm, prompt: planningPrompt, memory });
const executionChain = new ConversationChain({ llm, prompt: executionPrompt, memory });
const verificationChain = new ConversationChain({ llm, prompt: verificationPrompt, memory });
const styleEnforcerChain = new ConversationChain({ llm, prompt: styleEnforcerPrompt, memory });

export async function processFactoryTask(naturalLanguage: string, signer?: ethers.Signer): Promise<any> {
  try {
    const response = await planningChain.call({ input: naturalLanguage });
    const structured = await parser.parse(response.response);
    const task = structured.task;
    const params = structured.params;

    console.log(`[FactoryOrchestrator] Processing task: ${task}`);

    switch (task) {
      case "plan":
        const planResponse = await planningChain.call({ input: naturalLanguage });
        const planPath = `prompts/${params.userInput.replace(/\s+/g, '-')}-plan.md`;
        fs.writeFileSync(planPath, planResponse.response);
        memory.saveContext(
          { input: naturalLanguage },
          { output: JSON.stringify({ planPath }) }
        );
        return { planPath, plan: planResponse.response };

      case "execute":
        if (!params.planPath) throw new Error("Missing plan path");
        const plan = fs.readFileSync(params.planPath, 'utf8');
        const executionResponse = await executionChain.call({ input: naturalLanguage, plan });
        const executionResult = await parser.parse(executionResponse.response);
        const codePath = executionResult.params.codePath || `src/generated-${Date.now()}.ts`;
        fs.writeFileSync(codePath, executionResult.params.code);
        memory.saveContext(
          { input: naturalLanguage },
          { output: JSON.stringify({ codePath, commitMessage: executionResult.params.commitMessage }) }
        );
        return { codePath, code: executionResult.params.code, commitMessage: executionResult.params.commitMessage };

      case "verify":
        if (!params.planPath || !params.codePath) throw new Error("Missing plan or code path");
        const verifyPlan = fs.readFileSync(params.planPath, 'utf8');
        const code = fs.readFileSync(params.codePath, 'utf8');
        const verificationResponse = await verificationChain.call({ input: naturalLanguage, plan: verifyPlan, code });
        const verificationReport = JSON.parse(verificationResponse.response);
        memory.saveContext(
          { input: naturalLanguage },
          { output: JSON.stringify({ verificationReport }) }
        );
        if (verificationReport.issues && verificationReport.issues.length > 0) {
          await updatePrompts(verificationReport.issues, task);
        }
        return { verificationReport };

      case "enforceStyle":
        if (!params.codePath || !params.styleRules) throw new Error("Missing code path or style rules");
        const styleCode = fs.readFileSync(params.codePath, 'utf8');
        const styleResponse = await styleEnforcerChain.call({
          input: naturalLanguage,
          code: styleCode,
          style_rules: JSON.stringify(params.styleRules)
        });
        const styleResult = await parser.parse(styleResponse.response);
        const newCodePath = `src/styled-${Date.now()}-${params.codePath.split('/').pop()}`;
        fs.writeFileSync(newCodePath, styleResult.params.code);
        memory.saveContext(
          { input: naturalLanguage },
          { output: JSON.stringify({ codePath: newCodePath, commitMessage: styleResult.params.commitMessage }) }
        );
        return { codePath: newCodePath, code: styleResult.params.code, commitMessage: styleResult.params.commitMessage };

      default:
        // Delegate to LLMOrchestrator for other tasks (e.g., debugSmartContract)
        return await processUserCommand(naturalLanguage, signer);
    }
  } catch (error) {
    console.error("[FactoryOrchestrator] Error processing task:", error);
    throw error;
  }
}

async function updatePrompts(issues: string[], task: string): Promise<void> {
  const promptPath = `prompts/${task}-agent.txt`;
  let promptContent = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : '';
  issues.forEach(issue => {
    promptContent += `\n// Rule: Avoid ${issue}\n`;
  });
  fs.writeFileSync(promptPath, promptContent);
  console.log(`Updated prompt at ${promptPath}`);
}

export async function clearFactoryHistory(): Promise<void> {
  await memory.clear();
  console.log("Factory conversation history cleared");
}