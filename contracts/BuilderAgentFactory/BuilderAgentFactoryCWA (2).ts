import { ethers } from 'ethers';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import retry from 'async-retry';
import { LLMClient, LLMModel } from './LLMClient'; // Hypothetical LLM client
import { DAOContext } from './DAOContext'; // Hypothetical DAO context
import { TrustGraph, VectorDB } from './TrustGraph'; // Hypothetical vector DB for RAG
import { sanitizeInput, checkPermissions } from './SecurityUtils'; // Hypothetical security utilities

// Structured logger with correlation IDs
const logger = pino({
  level: 'info',
  base: { service: 'BuilderAgentFactoryCWA' },
});

// Interface for CWA layer configuration
interface CWALayerConfig {
  name: string;
  generateContent: (data: any, llmClient: LLMClient, model: LLMModel) => Promise<string>;
  priority: number;
  alwaysInclude: boolean;
  model: LLMModel;
  validateContent: (content: string) => boolean;
}

// Interface for task state
interface TaskState {
  step: 'plan' | 'execute' | 'verify' | 'refine';
  previousPlans: string[];
  verificationResults: string[];
}

// Interface for observability metrics
interface Metrics {
  stepLatency: number;
  llmTokensUsed: { [model: string]: number };
  success: boolean;
}

class BuilderAgentFactoryCWA {
  private llmClient: LLMClient;
  private daoContext: DAOContext;
  private trustGraph: TrustGraph;
  private vectorDB: VectorDB; // Added for Layer 5
  private taskState: TaskState;
  private cwaLayers: CWALayerConfig[];
  private maxTokens: number;
  private correlationId: string;
  private defaultModel: LLMModel = 'gpt';

  constructor(
    daoContext: DAOContext,
    llmClient: LLMClient,
    trustGraph: TrustGraph,
    vectorDB: VectorDB,
    maxTokens: number = 4000,
  ) {
    this.llmClient = llmClient;
    this.daoContext = daoContext;
    this.trustGraph = trustGraph;
    this.vectorDB = vectorDB;
    this.taskState = { step: 'plan', previousPlans: [], verificationResults: [] };
    this.maxTokens = maxTokens;
    this.correlationId = uuidv4();

    this.cwaLayers = [
      {
        name: 'Instructions',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Generate ethical instructions for a Builder Agent for ${data.daoName}, adhering to ${data.ethicalKernels.join(', ')}. Emphasize: fix inputs, not outputs.`;
          return llmClient.generate(prompt, { maxTokens: 200, model });
        },
        priority: 10,
        alwaysInclude: true,
        model: 'claude',
        validateContent: (content: string) => {
          const isValid = content.includes('fix inputs, not outputs') && !content.includes('hallucinate');
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Instructions content');
          return isValid;
        },
      },
      {
        name: 'User Info',
        generateContent: async (data: DAOContext) => `
          DAO: ${data.name}
          Treasury Balance: ${data.treasuryBalance} ETH
          Active Proposals: ${data.activeProposals.length}
          Ethical Kernels: ${data.ethicalKernels.join(', ')}
        `,
        priority: 9,
        alwaysInclude: true,
        model: 'gpt',
        validateContent: (content: string) => true,
      },
      {
        name: 'Curated Knowledge',
        generateContent: async (data, llmClient, model) => {
          const ragData = await data.trustGraph.retrieveRelevantData(data.userQuery);
          const prompt = `Summarize retrieved data for ${data.userQuery}: Plan: ${ragData.plan || 'None'}, Code: ${ragData.code || 'None'}, Errors: ${ragData.errors || 'None'}, Settings: ${ragData.settings || 'None'}.`;
          return llmClient.generate(prompt, { maxTokens: 300, model });
        },
        priority: 8,
        alwaysInclude: false,
        model: 'gemini', // Assigned to Gemini
        validateContent: (content: string) => {
          const isValid = content.includes('Retrieved Data:');
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Curated Knowledge content');
          return isValid;
        },
      },
      {
        name: 'Task State',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Generate task state for step ${data.taskState.step}. Include previous plans: ${data.taskState.previousPlans.join(' | ') || 'None'}, last verification: ${data.taskState.verificationResults.slice(-1) || 'None'}.`;
          return llmClient.generate(prompt, { maxTokens: 200, model });
        },
        priority: 7,
        alwaysInclude: true,
        model: 'grok',
        validateContent: (content: string) => {
          const isValid = content.includes('Current Step:') && content.includes('Previous Plans:');
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Task State content');
          return isValid;
        },
      },
      {
        name: 'Historical Context',
        generateContent: async (data, llmClient, model) => {
          const relevantHistory = await data.vectorDB.searchSimilarPlans(data.userQuery, 3); // Vector DB search
          const prompt = `Summarize history: ${relevantHistory.map((p, i) => `Plan ${i + 1}: ${p.text}`).join('\n') || 'No prior history'}.`;
          return llmClient.generate(prompt, { maxTokens: 200, model });
        },
        priority: 6,
        alwaysInclude: false,
        model: 'gemini',
        validateContent: (content: string) => true,
      },
      {
        name: 'Domain Context',
        generateContent: async () => `
          Domain: Solidity v0.8.0
          Optimize for gas efficiency
          Ensure compatibility with Hardhat testing
          Follow DAO governance norms
        `,
        priority: 5,
        alwaysInclude: true,
        model: 'gpt',
        validateContent: (content: string) => true,
      },
      {
        name: 'Tool Explanation',
        generateContent: async () => `
          Tools:
          - Hardhat: Run 'npx hardhat test' to verify code.
          - Octokit: Create GitHub PRs for verified code.
          - ethers.js: Execute DAO proposals on-chain.
        `,
        priority: 4,
        alwaysInclude: false,
        model: 'claude',
        validateContent: (content: string) => true,
      },
      {
        name: 'Constraints',
        generateContent: async (data: DAOContext) => `
          Gas Limit: Do not increase gas cost by >10%.
          Budget: Respect ${data.treasuryBalance} ETH limit.
          Ethics: Align with ${data.ethicalKernels.join(', ')}.
        `,
        priority: 3,
        alwaysInclude: true,
        model: 'gpt',
        validateContent: (content: string) => true,
      },
      {
        name: 'Examples',
        generateContent: async () => `
          Example Fix:
          \`\`\`solidity
          bool locked;
          modifier nonReentrant {
            require(!locked);
            locked = true;
            _;
            locked = false;
          }
          \`\`\`
        `,
        priority: 2,
        alwaysInclude: false,
        model: 'claude',
        validateContent: (content: string) => true,
      },
      {
        name: 'Intermediate Results',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Summarize intermediate results: ${data.taskState.verificationResults.slice(-1) || 'None'}.`;
          return llmClient.generate(prompt, { maxTokens: 200, model });
        },
        priority: 1,
        alwaysInclude: false,
        model: 'grok',
        validateContent: (content: string) => {
          const isValid = content.includes('Draft Output:');
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Intermediate Results content');
          return isValid;
        },
      },
      {
        name: 'User Query',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Clarify user query: ${data.userQuery}`;
          return llmClient.generate(prompt, { maxTokens: 100, model });
        },
        priority: 0,
        alwaysInclude: true,
        model: 'claude',
        validateContent: (content: string) => {
          const isValid = content.length > 0;
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid User Query content');
          return isValid;
        },
      },
    ].sort((a, b) => b.priority - a.priority);
  }

  private tokenEstimator(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async buildContextWindow(userQuery: string): Promise<string> {
    let currentTokens = 0;
    const contextParts: string[] = [];
    const sanitizedQuery = sanitizeInput(userQuery);
    logger.info({ correlationId: this.correlationId, userQuery: sanitizedQuery }, 'Building context window');

    for (const layerConfig of this.cwaLayers) {
      let layerContent = '';
      try {
        await checkPermissions(this.daoContext, 'read');
        const data = {
          daoName: this.daoContext.name,
          ethicalKernels: this.daoContext.ethicalKernels,
          userQuery: sanitizedQuery,
          trustGraph: this.trustGraph,
          vectorDB: this.vectorDB,
          taskState: this.taskState,
          previousPlans: this.taskState.previousPlans,
        };
        layerContent = await retry(
          () => layerConfig.generateContent(data, this.llmClient, layerConfig.model),
          { retries: 3, minTimeout: 1000 },
        );
        if (!layerConfig.validateContent(layerContent)) {
          logger.warn({ correlationId: this.correlationId, layer: layerConfig.name }, 'Falling back to default model');
          layerContent = await this.llmClient.generate(
            `Generate content for ${layerConfig.name} with data: ${JSON.stringify(data)}`,
            { maxTokens: 200, model: this.defaultModel },
          );
        }
      } catch (error) {
        logger.error({ correlationId: this.correlationId, layer: layerConfig.name, error }, 'Error generating layer content');
        layerContent = `[Error retrieving ${layerConfig.name} content]`;
      }

      const formattedLayer = `### ${layerConfig.name}\n${layerContent}`;
      const layerTokens = this.tokenEstimator(formattedLayer);

      if (currentTokens + layerTokens <= this.maxTokens || layerConfig.alwaysInclude) {
        contextParts.push(formattedLayer);
        currentTokens += layerTokens;
        logger.info({ correlationId: this.correlationId, layer: layerConfig.name, tokens: layerTokens, model: layerConfig.model }, 'Layer added to context');
      } else {
        logger.warn({ correlationId: this.correlationId, layer: layerConfig.name }, 'Skipping layer due to token limit');
      }
    }

    const userQueryLayer = contextParts.find(part => part.startsWith('### User Query'));
    if (userQueryLayer) {
      contextParts.splice(contextParts.indexOf(userQueryLayer), 1);
      contextParts.push(userQueryLayer);
    }

    const finalContext = contextParts.join('\n\n');
    logger.info({ correlationId: this.correlationId, tokens: currentTokens }, 'Context window built');
    return finalContext;
  }

  public async runPipeline(userQuery: string): Promise<string> {
    const startTime = Date.now();
    const metrics: Metrics = { stepLatency: 0, llmTokensUsed: {}, success: false };
    logger.info({ correlationId: this.correlationId, userQuery }, `Starting pipeline: ${this.taskState.step}`);

    const prompt = await this.buildContextWindow(userQuery);

    try {
      let output: string;
      switch (this.taskState.step) {
        case 'plan':
          output = await retry(
            async () => {
              const result = await this.llmClient.generate(prompt, { maxTokens: 500, model: 'grok' });
              if (!this.validateOutput(result, 'plan')) {
                throw new Error('Invalid LLM output for plan step');
              }
              return result;
            },
            { retries: 3, minTimeout: 1000 },
          );
          metrics.llmTokensUsed['grok'] = (metrics.llmTokensUsed['grok'] || 0) + this.tokenEstimator(output);
          this.taskState.previousPlans.push(output);
          this.taskState.step = 'execute';
          metrics.success = true;
          return `Generated plan: ${output}`;

        case 'execute':
          output = await retry(
            async () => {
              const result = await this.llmClient.generate(prompt, { maxTokens: 1000, model: 'gpt' });
              if (!this.validateOutput(result, 'execute')) {
                throw new Error('Invalid LLM output for execute step');
              }
              return result;
            },
            { retries: 3, minTimeout: 1000 },
          );
          metrics.llmTokensUsed['gpt'] = (metrics.llmTokensUsed['gpt'] || 0) + this.tokenEstimator(output);
          this.taskState.step = 'verify';
          metrics.success = true;
          return `Generated code: ${output}`;

        case 'verify':
          try {
            const testResult = execSync('npx hardhat test').toString();
            this.taskState.verificationResults.push(testResult);
            if (testResult.includes('0 failures')) {
              const prUrl = await this.createPR(output);
              this.taskState.step = 'plan';
              metrics.success = true;
              return `Verification passed. PR created: ${prUrl}`;
            } else {
              this.taskState.step = 'refine';
              metrics.success = false;
              return `Verification failed: ${testResult}`;
            }
          } catch (error) {
            logger.error({ correlationId: this.correlationId, error }, 'Hardhat test failed');
            this.taskState.verificationResults.push(error.message);
            this.taskState.step = 'refine';
            metrics.success = false;
            return `Verification error: ${error.message}`;
          }

        case 'refine':
          output = await retry(
            async () => {
              const result = await this.llmClient.generate(
                `${prompt}\nRefine based on: ${this.taskState.verificationResults.slice(-1)}`,
                { maxTokens: 500, model: 'grok' },
              );
              if (!this.validateOutput(result, 'refine')) {
                throw new Error('Invalid LLM output for refine step');
              }
              return result;
            },
            { retries: 3, minTimeout: 1000 },
          );
          metrics.llmTokensUsed['grok'] = (metrics.llmTokensUsed['grok'] || 0) + this.tokenEstimator(output);
          this.taskState.previousPlans.push(output);
          this.taskState.step = 'execute';
          metrics.success = true;
          return `Refined plan: ${output}`;
      }
    } catch (error) {
      logger.error({ correlationId: this.correlationId, error }, `Pipeline error at step ${this.taskState.step}`);
      metrics.success = false;
      return `Error in ${this.taskState.step} step: ${error.message}. Please try again or contact support.`;
    } finally {
      metrics.stepLatency = Date.now() - startTime;
      logger.info({ correlationId: this.correlationId, metrics }, `Pipeline step completed: ${this.taskState.step}`);
    }
  }

  private validateOutput(output: string, step: string): boolean {
    if (!output || output.length < 10) {
      logger.warn({ correlationId: this.correlationId, step }, 'LLM output too short or empty');
      return false;
    }
    if (step === 'execute' && !output.includes('pragma solidity')) {
      logger.warn({ correlationId: this.correlationId, step }, 'LLM output lacks Solidity code');
      return false;
    }
    return true;
  }

  private async createPR(code: string): Promise<string> {
    try {
      await checkPermissions(this.daoContext, 'write');
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const { data } = await octokit.pulls.create({
        owner: 'cuttlefish-labs',
        repo: `${this.daoContext.name.toLowerCase()}-dao`,
        title: `Auto-generated fix for ${this.daoContext.name}`,
        body: `Generated by Builder Agent Factory using CWA.\n\nCode:\n\`\`\`solidity\n${code}\n\`\`\``,
        head: `fix-${Date.now()}`,
        base: 'main',
      });
      logger.info({ correlationId: this.correlationId, prUrl: data.html_url }, 'PR created');
      return data.html_url;
    } catch (error) {
      logger.error({ correlationId: this.correlationId, error }, 'Failed to create PR');
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }
}

export default BuilderAgentFactoryCWA;