import { ethers } from 'ethers';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import retry from 'async-retry';
import { LLMClient, LLMModel } from './LLMClient';
import { DAOContext } from './DAOContext';
import { TrustGraph, VectorDB } from './TrustGraph';
import { sanitizeInput, checkPermissions } from './SecurityUtils';
import { loadPolicies, Policy } from './PolicyManager';
import { SlitherAnalyzer } from './SecurityAnalyzer';

const logger = pino({
  level: 'info',
  base: { service: 'BuilderAgentFactoryCWA' },
});

interface CWALayerConfig {
  name: string;
  generateContent: (data: any, llmClient: LLMClient, model: LLMModel) => Promise<{ content: string; confidence: number }>;
  priority: number;
  alwaysInclude: boolean;
  model: LLMModel;
  validateContent: (content: string, confidence: number) => boolean;
  recoverContent: (error: any, data: any, llmClient: LLMClient, model: LLMModel) => Promise<string>;
}

interface TaskState {
  step: 'plan' | 'execute' | 'verify' | 'refine';
  previousPlans: string[];
  verificationResults: string[];
  lastValidState?: string;
}

interface Metrics {
  stepLatency: number;
  llmTokensUsed: { [model: string]: number };
  success: boolean;
  confidenceScores: { [layer: string]: number };
}

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
        name: 'Widget Data',
        generateContent: async (data, llmClient, model) => {
          const mockData = {
            co2: "900,000",
            mw: "6",
            daos: "3",
          };
          try {
            const dataSource = data.widgetDataSource || 'https://your-api.com/widget-data.json';
            const res = await fetch(dataSource);
            const json = await res.json();
            return { content: JSON.stringify(json), confidence: 0.95 };
          } catch (error) {
            logger.warn({ correlationId: this.correlationId, error }, 'Failed to fetch widget data, using mock');
            return { content: JSON.stringify(mockData), confidence: 0.7 };
          }
        },
        priority: 9,
        alwaysInclude: false,
        model: 'gemini',
        validateContent: (content: string, confidence: number) => {
          try {
            const parsed = JSON.parse(content);
            return parsed.co2 && parsed.mw && parsed.daos && confidence > 0.6;
          } catch {
            return false;
          }
        },
        recoverContent: async () => {
          const mockData = { co2: "900,000", mw: "6", daos: "3" };
          return JSON.stringify(mockData);
        },
      },
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
      // Other layers (User Info, Curated Knowledge, etc.) remain unchanged
      // ... (omitted for brevity, same as previous artifact)
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
          widgetDataSource: 'https://your-api.com/widget-data.json',
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
          confidence = 0.5;
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
    // ... (unchanged from previous artifact, omitted for brevity)
  }

  private validateOutput(output: string, step: string, confidence: number): boolean {
    // ... (unchanged)
  }

  private shouldEscalateToHuman(error: any): boolean {
    // ... (unchanged)
  }

  private async createPR(code: string): Promise<string> {
    // ... (unchanged)
  }
}

export default BuilderAgentFactoryCWA;