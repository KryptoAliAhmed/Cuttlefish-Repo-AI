import { ethers } from 'ethers';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import retry from 'async-retry';
import { LLMClient, LLMModel } from './LLMClient'; // Hypothetical LLM client
import { DAOContext } from './DAOContext'; // Hypothetical DAO context
import { TrustGraph, VectorDB } from './TrustGraph'; // Hypothetical vector DB
import { sanitizeInput, checkPermissions } from './SecurityUtils'; // Hypothetical security utilities
import { loadPolicies, Policy } from './PolicyManager'; // Hypothetical policy manager
import { SlitherAnalyzer } from './SecurityAnalyzer'; // Hypothetical Slither integration

// Structured logger with correlation IDs
const logger = pino({
  level: 'info',
  base: { service: 'BuilderAgentFactoryCWA' },
});

// Interface for CWA layer configuration
interface CWALayerConfig {
  name: string;
  generateContent: (data: any, llmClient: LLMClient, model: LLMModel) => Promise<{ content: string; confidence: number }>;
  priority: number;
  alwaysInclude: boolean;
  model: LLMModel;
  validateContent: (content: string, confidence: number) => boolean;
  recoverContent: (error: any, data: any, llmClient: LLMClient, model: LLMModel) => Promise<string>;
}

// Interface for task state
interface TaskState {
  step: 'plan' | 'execute' | 'verify' | 'refine';
  previousPlans: string[];
  verificationResults: string[];
  lastValidState?: string;
}

// Interface for observability metrics
interface Metrics {
  stepLatency: number;
  llmTokensUsed: { [model: string]: number };
  success: boolean;
  confidenceScores: { [layer: string]: number };
}

// Interface for audit trail
interface AuditLog {
  timestamp: string;
  layer: string;
  model: LLMModel;
  prompt: string;
  response: string;
  tokens: number;
  confidence: number;
}

class BuilderAgentFactoryCWA {
  private llmClient: LLMClient;
  private daoContext: DAOContext;
  private trustGraph: TrustGraph;
  private vectorDB: VectorDB;
  private taskState: TaskState;
  private cwaLayers: CWALayerConfig[];
  private policies: Policy[];
  private maxTokens: number;
  private correlationId: string;
  private defaultModel: LLMModel = 'gpt';
  private auditLogs: AuditLog[] = [];
  private slitherAnalyzer: SlitherAnalyzer;

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
    this.policies = loadPolicies();
    this.maxTokens = maxTokens;
    this.correlationId = uuidv4();
    this.slitherAnalyzer = new SlitherAnalyzer();

    this.cwaLayers = [
      {
        name: 'Instructions',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Generate ethical instructions for a Builder Agent for ${data.daoName}, adhering to ${data.ethicalKernels.join(', ')}. Emphasize: fix inputs, not outputs.`;
          const { content, confidence } = await llmClient.generateWithConfidence(prompt, { maxTokens: 200, model });
          return { content, confidence };
        },
        priority: 10,
        alwaysInclude: true,
        model: 'claude',
        validateContent: (content: string, confidence: number) => {
          const isValid = content.includes('fix inputs, not outputs') && !content.includes('hallucinate') && confidence > 0.8;
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Instructions content');
          return isValid;
        },
        recoverContent: async (error, data, llmClient, model) => {
          logger.warn({ correlationId: this.correlationId, error }, 'Recovering Instructions layer');
          const prompt = `Regenerate ethical instructions with stricter constraints for ${data.daoName}.`;
          return (await llmClient.generate(prompt, { maxTokens: 200, model: 'claude' })).content;
        },
      },
      {
        name: 'User Info',
        generateContent: async (data: DAOContext) => ({ content: `
          DAO: ${data.name}
          Treasury Balance: ${data.treasuryBalance} ETH
          Active Proposals: ${data.activeProposals.length}
          Ethical Kernels: ${data.ethicalKernels.join(', ')}
        `, confidence: 1.0 }),
        priority: 9,
        alwaysInclude: true,
        model: 'gpt',
        validateContent: () => true,
        recoverContent: async () => 'Default user info',
      },
      {
        name: 'Curated Knowledge',
        generateContent: async (data, llmClient, model) => {
          const ragData = await data.trustGraph.retrieveRelevantData(data.userQuery);
          const prompt = `Summarize retrieved data for ${data.userQuery}: Plan: ${ragData.plan || 'None'}, Code: ${ragData.code || 'None'}, Errors: ${ragData.errors || 'None'}, Settings: ${ragData.settings || 'None'}.`;
          return llmClient.generateWithConfidence(prompt, { maxTokens: 300, model });
        },
        priority: 8,
        alwaysInclude: false,
        model: 'gemini',
        validateContent: (content: string, confidence: number) => {
          const isValid = content.includes('Retrieved Data:') && confidence > 0.7;
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Curated Knowledge content');
          return isValid;
        },
        recoverContent: async (error, data, llmClient, model) => {
          logger.warn({ correlationId: this.correlationId, error }, 'Recovering Curated Knowledge layer');
          const reformulatedQuery = `General knowledge for ${data.userQuery}`;
          const ragData = await data.trustGraph.retrieveRelevantData(reformulatedQuery);
          return (await llmClient.generate(`Summarize: ${JSON.stringify(ragData)}`, { maxTokens: 300, model: 'gpt' })).content;
        },
      },
      {
        name: 'Task State',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Generate task state for step ${data.taskState.step}. Include previous plans: ${data.taskState.previousPlans.join(' | ') || 'None'}, last verification: ${data.taskState.verificationResults.slice(-1) || 'None'}.`;
          return llmClient.generateWithConfidence(prompt, { maxTokens: 200, model });
        },
        priority: 7,
        alwaysInclude: true,
        model: 'grok',
        validateContent: (content: string, confidence: number) => {
          const isValid = content.includes('Current Step:') && content.includes('Previous Plans:') && confidence > 0.8;
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Task State content');
          return isValid;
        },
        recoverContent: async (error, data) => {
          logger.warn({ correlationId: this.correlationId, error }, 'Recovering Task State layer');
          return data.taskState.lastValidState || 'Default state: plan';
        },
      },
      {
        name: 'Historical Context',
        generateContent: async (data, llmClient, model) => {
          const relevantHistory = await data.vectorDB.searchSimilarPlans(data.userQuery, 3);
          const prompt = `Summarize history: ${relevantHistory.map((p, i) => `Plan ${i + 1}: ${p.text} (Score: ${p.score})`).join('\n') || 'No prior history'}.`;
          const summarized = await llmClient.summarize(prompt, { maxTokens: 200, model });
          return { content: summarized, confidence: relevantHistory.length > 0 ? 0.9 : 0.6 };
        },
        priority: 6,
        alwaysInclude: false,
        model: 'gemini',
        validateContent: () => true,
        recoverContent: async () => 'No historical context available',
      },
      {
        name: 'Domain Context',
        generateContent: async () => ({ content: `
          Domain: Solidity v0.8.0
          Optimize for gas efficiency
          Ensure compatibility with Hardhat testing
          Follow DAO governance norms
        `, confidence: 1.0 }),
        priority: 5,
        alwaysInclude: true,
        model: 'gpt',
        validateContent: () => true,
        recoverContent: async () => 'Default domain context',
      },
      {
        name: 'Tool Explanation',
        generateContent: async () => ({ content: `
          Tools:
          - Hardhat: Run 'npx hardhat test' to verify code.
          - Octokit: Create GitHub PRs for verified code.
          - ethers.js: Execute DAO proposals on-chain.
        `, confidence: 1.0 }),
        priority: 4,
        alwaysInclude: false,
        model: 'claude',
        validateContent: () => true,
        recoverContent: async () => 'Default tool instructions',
      },
      {
        name: 'Constraints',
        generateContent: async (data: DAOContext) => ({ content: `
          Gas Limit: Do not increase gas cost by >10%.
          Budget: Respect ${data.treasuryBalance} ETH limit.
          Ethics: Align with ${data.ethicalKernels.join(', ')}.
        `, confidence: 1.0 }),
        priority: 3,
        alwaysInclude: true,
        model: 'gpt',
        validateContent: () => true,
        recoverContent: async () => 'Default constraints',
      },
      {
        name: 'Examples',
        generateContent: async () => ({ content: `
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
        `, confidence: 1.0 }),
        priority: 2,
        alwaysInclude: false,
        model: 'claude',
        validateContent: () => true,
        recoverContent: async () => 'No examples available',
      },
      {
        name: 'Intermediate Results',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Summarize intermediate results: ${data.taskState.verificationResults.slice(-1) || 'None'}. Include reasoning: Why did this result occur?`;
          return llmClient.generateWithConfidence(prompt, { maxTokens: 200, model });
        },
        priority: 1,
        alwaysInclude: false,
        model: 'grok',
        validateContent: (content: string, confidence: number) => {
          const isValid = content.includes('Draft Output:') && confidence > 0.7;
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid Intermediate Results content');
          return isValid;
        },
        recoverContent: async () => 'No intermediate results',
      },
      {
        name: 'User Query',
        generateContent: async (data, llmClient, model) => {
          const prompt = `Clarify user query: ${data.userQuery}`;
          return llmClient.generateWithConfidence(prompt, { maxTokens: 100, model });
        },
        priority: 0,
        alwaysInclude: true,
        model: 'claude',
        validateContent: (content: string, confidence: number) => {
          const isValid = content.length > 0 && confidence > 0.8;
          if (!isValid) logger.warn({ correlationId: this.correlationId }, 'Invalid User Query content');
          return isValid;
        },
        recoverContent: async (error, data) => data.userQuery,
      },
    ].sort((a, b) => b.priority - a.priority);
  }

  private tokenEstimator(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async buildContextWindow(userQuery: string): Promise<string> {
    let currentTokens = 0;
    const contextParts: string[] = [];
    const metrics: Metrics = { stepLatency: 0, llmTokensUsed: {}, success: false, confidenceScores: {} };
    const sanitizedQuery = sanitizeInput(userQuery);
    logger.info({ correlationId: this.correlationId, userQuery: sanitizedQuery }, 'Building context window');

    for (const layerConfig of this.cwaLayers) {
      let layerContent = '';
      let confidence = 0;
      try {
        await checkPermissions(this.daoContext, 'read', this.policies);
        const data = {
          daoName: this.daoContext.name,
          ethicalKernels: this.daoContext.ethicalKernels,
          userQuery: sanitizedQuery,
          trustGraph: this.trustGraph,
          vectorDB: this.vectorDB,
          taskState: this.taskState,
          previousPlans: this.taskState.previousPlans,
        };
        const { content, confidence: conf } = await retry(
          () => layerConfig.generateContent(data, this.llmClient, layerConfig.model),
          { retries: 3, minTimeout: 1000 },
        );
        layerContent = content;
        confidence = conf;
        if (!layerConfig.validateContent(layerContent, confidence)) {
          logger.warn({ correlationId: this.correlationId, layer: layerConfig.name }, 'Falling back to default model');
          layerContent = await layerConfig.recoverContent(null, data, this.llmClient, this.defaultModel);
          confidence = 0.5; // Lower confidence for fallback
        }
        metrics.confidenceScores[layerConfig.name] = confidence;
        this.auditLogs.push({
          timestamp: new Date().toISOString(),
          layer: layerConfig.name,
          model: layerConfig.model,
          prompt: JSON.stringify(data),
          response: layerContent,
          tokens: this.tokenEstimator(layerContent),
          confidence,
        });
      } catch (error) {
        logger.error({ correlationId: this.correlationId, layer: layerConfig.name, error }, 'Error generating layer content');
        layerContent = await layerConfig.recoverContent(error, { userQuery: sanitizedQuery, taskState: this.taskState }, this.llmClient, this.defaultModel);
        confidence = 0.3;
        this.auditLogs.push({
          timestamp: new Date().toISOString(),
          layer: layerConfig.name,
          model: layerConfig.model,
          prompt: 'Error during generation',
          response: layerContent,
          tokens: this.tokenEstimator(layerContent),
          confidence,
        });
      }

      const formattedLayer = `### ${layerConfig.name}\n${layerContent}`;
      const layerTokens = this.tokenEstimator(formattedLayer);

      if (currentTokens + layerTokens <= this.maxTokens || layerConfig.alwaysInclude) {
        contextParts.push(formattedLayer);
        currentTokens += layerTokens;
        metrics.llmTokensUsed[layerConfig.model] = (metrics.llmTokensUsed[layerConfig.model] || 0) + layerTokens;
        logger.info({ correlationId: this.correlationId, layer: layerConfig.name, tokens: layerTokens, model: layerConfig.model, confidence }, 'Layer added to context');
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
    logger.info({ correlationId: this.correlationId, tokens: currentTokens, metrics }, 'Context window built');
    return finalContext;
  }

  public async runPipeline(userQuery: string): Promise<string> {
    const startTime = Date.now();
    const metrics: Metrics = { stepLatency: 0, llmTokensUsed: {}, success: false, confidenceScores: {} };
    logger.info({ correlationId: this.correlationId, userQuery }, `Starting pipeline: ${this.taskState.step}`);

    const prompt = await this.buildContextWindow(userQuery);
    this.taskState.lastValidState = this.taskState.step;

    try {
      let output: string;
      let confidence: number;
      switch (this.taskState.step) {
        case 'plan':
          ({ content: output, confidence } = await retry(
            async () => {
              const result = await this.llmClient.generateWithConfidence(prompt, { maxTokens: 500, model: 'grok' });
              if (!this.validateOutput(result.content, 'plan', result.confidence)) {
                throw new Error('Invalid LLM output for plan step');
              }
              return result;
            },
            { retries: 3, minTimeout: 1000 },
          ));
          metrics.llmTokensUsed['grok'] = (metrics.llmTokensUsed['grok'] || 0) + this.tokenEstimator(output);
          metrics.confidenceScores['plan'] = confidence;
          this.taskState.previousPlans.push(output);
          this.taskState.step = 'execute';
          metrics.success = true;
          this.auditLogs.push({ timestamp: new Date().toISOString(), layer: 'Pipeline', model: 'grok', prompt, response: output, tokens: this.tokenEstimator(output), confidence });
          return `Generated plan: ${output}`;

        case 'execute':
          ({ content: output, confidence } = await retry(
            async () => {
              const result = await this.llmClient.generateWithConfidence(prompt, { maxTokens: 1000, model: 'gpt' });
              if (!this.validateOutput(result.content, 'execute', result.confidence)) {
                throw new Error('Invalid LLM output for execute step');
              }
              return result;
            },
            { retries: 3, minTimeout: 1000 },
          ));
          metrics.llmTokensUsed['gpt'] = (metrics.llmTokensUsed['gpt'] || 0) + this.tokenEstimator(output);
          metrics.confidenceScores['execute'] = confidence;
          this.taskState.step = 'verify';
          metrics.success = true;
          this.auditLogs.push({ timestamp: new Date().toISOString(), layer: 'Pipeline', model: 'gpt', prompt, response: output, tokens: this.tokenEstimator(output), confidence });
          return `Generated code: ${output}`;

        case 'verify':
          try {
            const slitherResult = await this.slitherAnalyzer.analyze(output);
            if (slitherResult.issues.length > 0) {
              this.taskState.verificationResults.push(`Slither issues: ${JSON.stringify(slitherResult.issues)}`);
              this.taskState.step = 'refine';
              metrics.success = false;
              return `Verification failed: ${slitherResult.issues.map(i => i.description).join(', ')}`;
            }
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
            logger.error({ correlationId: this.correlationId, error }, 'Verification failed');
            this.taskState.verificationResults.push(error.message);
            this.taskState.step = 'refine';
            metrics.success = false;
            return `Verification error: ${error.message}`;
          }

        case 'refine':
          ({ content: output, confidence } = await retry(
            async () => {
              const result = await this.llmClient.generateWithConfidence(
                `${prompt}\nRefine based on: ${this.taskState.verificationResults.slice(-1)}`,
                { maxTokens: 500, model: 'grok' },
              );
              if (!this.validateOutput(result.content, 'refine', result.confidence)) {
                throw new Error('Invalid LLM output for refine step');
              }
              return result;
            },
            { retries: 3, minTimeout: 1000 },
          ));
          metrics.llmTokensUsed['grok'] = (metrics.llmTokensUsed['grok'] || 0) + this.tokenEstimator(output);
          metrics.confidenceScores['refine'] = confidence;
          this.taskState.previousPlans.push(output);
          this.taskState.step = 'execute';
          metrics.success = true;
          this.auditLogs.push({ timestamp: new Date().toISOString(), layer: 'Pipeline', model: 'grok', prompt, response: output, tokens: this.tokenEstimator(output), confidence });
          return `Refined plan: ${output}`;
      }
    } catch (error) {
      logger.error({ correlationId: this.correlationId, error }, `Pipeline error at step ${this.taskState.step}`);
      if (this.shouldEscalateToHuman(error)) {
        return `Critical error in ${this.taskState.step} step: ${error.message}. Escalating to human review.`;
      }
      metrics.success = false;
      return `Error in ${this.taskState.step} step: ${error.message}. Retrying with recovery.`;
    } finally {
      metrics.stepLatency = Date.now() - startTime;
      logger.info({ correlationId: this.correlationId, metrics }, `Pipeline step completed: ${this.taskState.step}`);
    }
  }

  private validateOutput(output: string, step: string, confidence: number): boolean {
    if (!output || output.length < 10 || confidence < 0.6) {
      logger.warn({ correlationId: this.correlationId, step, confidence }, 'LLM output invalid or low confidence');
      return false;
    }
    if (step === 'execute' && !output.includes('pragma solidity')) {
      logger.warn({ correlationId: this.correlationId, step }, 'LLM output lacks Solidity code');
      return false;
    }
    return true;
  }

  private shouldEscalateToHuman(error: any): boolean {
    return error.message.includes('unrecoverable') || this.taskState.verificationResults.length > 5;
  }

  private async createPR(code: string): Promise<string> {
    try {
      await checkPermissions(this.daoContext, 'write', this.policies);
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
      this.auditLogs.push({ timestamp: new Date().toISOString(), layer: 'PR', model: 'none', prompt: 'Create PR', response: data.html_url, tokens: 0, confidence: 1.0 });
      return data.html_url;
    } catch (error) {
      logger.error({ correlationId: this.correlationId, error }, 'Failed to create PR');
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }
}

export default BuilderAgentFactoryCWA;