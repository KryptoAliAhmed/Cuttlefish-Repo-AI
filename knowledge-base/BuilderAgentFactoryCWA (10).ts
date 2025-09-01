import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import retry from 'async-retry';
import { LLMClient } from './llm/LLMClient';
import { DAOContext } from './dao/DAOContext';
import { TrustGraph, VectorDB } from './rag/TrustGraph';
import { HardhatClient } from './tools/HardhatClient';
import { OctokitClient } from './tools/OctokitClient';
import { EthersClient } from './tools/EthersClient';
import { estimateTokens } from './utils/tokenUtils';
import { InstructionsLayer } from './cwa/layers/InstructionsLayer';
import { WidgetDataLayer } from './cwa/layers/WidgetDataLayer';
import { KernelWeightsLayer } from './cwa/layers/KernelWeightsLayer';
import { PilotProjectsLayer } from './cwa/layers/PilotProjectsLayer';
import { WalletInteractionsLayer } from './cwa/layers/WalletInteractionsLayer';
import { ToolExplanationLayer } from './cwa/layers/ToolExplanationLayer';
import { SovereignWealthDAOLayer } from './cwa/layers/SovereignWealthDAOLayer';
import { CWALayerConfig, AuditLog, TaskState, Metrics, ToolCall, LLMModel } from './types';
import { logger } from './utils/logger';

export class BuilderAgentFactoryCWA {
  private llmClient: LLMClient;
  private daoContext: DAOContext;
  private trustGraph: TrustGraph;
  private vectorDB: VectorDB;
  private taskState: TaskState;
  private cwaLayers: CWALayerConfig[];
  private hardhatClient: HardhatClient;
  private octokitClient: OctokitClient;
  private ethersClient: EthersClient;
  private maxTokens: number;
  private correlationId: string;
  private defaultModel: LLMModel = 'gpt';
  private auditLogs: AuditLog[] = [];

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
    this.hardhatClient = new HardhatClient();
    this.octokitClient = new OctokitClient();
    this.ethersClient = new EthersClient();

    this.cwaLayers = [
      InstructionsLayer,
      WidgetDataLayer,
      KernelWeightsLayer,
      PilotProjectsLayer,
      WalletInteractionsLayer,
      ToolExplanationLayer,
      SovereignWealthDAOLayer,
    ].sort((a, b) => b.priority - a.priority);
  }

  private async buildContextWindow(userQuery: string): Promise<string> {
    let currentTokens = 0;
    const contextParts: string[] = [];
    const metrics: Metrics = { stepLatency: 0, llmTokensUsed: {}, success: false, confidenceScores: {} };
    const sanitizedQuery = userQuery;

    for (const layerConfig of this.cwaLayers) {
      let layerContent = '';
      let confidence = 0;
      try {
        const startTime = Date.now();
        const data = {
          daoName: this.daoContext.name,
          ethicalKernels: this.daoContext.ethicalKernels,
          userQuery: sanitizedQuery,
          trustGraph: this.trustGraph,
          vectorDB: this.vectorDB,
          taskState: this.taskState,
          widgetDataSource: 'https://your-api.com/widget-data.json',
          pilotDataSource: 'https://your-api.com/pilot-data.json',
          daoAddress: '0x1234567890123456789012345678901234567890',
          walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
          proposalId: 1,
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
          tokens: estimateTokens(layerContent),
          confidence,
        });
        metrics.stepLatency += Date.now() - startTime;
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
          tokens: estimateTokens(layerContent),
          confidence,
        });
      }

      const formattedLayer = `### ${layerConfig.name}\n${layerContent}`;
      const layerTokens = estimateTokens(formattedLayer);

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

    // Persistence: Save auditLogs and taskState to Supabase/Firestore
    // await supabase.from('cwa_logs').insert(this.auditLogs);
    // await supabase.from('task_state').upsert({ correlationId: this.correlationId, state: this.taskState });

    return finalContext;
  }

  async runPipeline(userQuery: string): Promise<string> {
    this.taskState.step = 'plan';
    let output = '';
    const metrics: Metrics = { stepLatency: 0, llmTokensUsed: {}, success: false, confidenceScores: {} };

    // Plan
    const startTime = Date.now();
    const context = await this.buildContextWindow(userQuery);
    const planPrompt = `Create a plan for: ${userQuery}\nContext:\n${context}\nOutput JSON: { "plan": string, "tool_calls": ToolCall[] }`;
    let planResult = await this.llmClient.generate(planPrompt, { maxTokens: 500, model: this.defaultModel });
    metrics.stepLatency += Date.now() - startTime;

    try {
      const parsedPlan = JSON.parse(planResult.content);
      this.taskState.previousPlans.push(parsedPlan.plan);
      this.auditLogs.push({
        timestamp: new Date().toISOString(),
        layer: 'Pipeline',
        model: this.defaultModel,
        prompt: planPrompt,
        response: planResult.content,
        tokens: estimateTokens(planResult.content),
        confidence: planResult.confidence,
      });
    } catch (error) {
      logger.error({ correlationId: this.correlationId, error }, 'Failed to parse plan');
      return 'Error: Invalid plan format';
    }

    // Execute
    this.taskState.step = 'execute';
    const { plan, tool_calls } = JSON.parse(planResult.content);
    for (const toolCall of (tool_calls as ToolCall[]) || []) {
      try {
        let toolResult: any;
        if (toolCall.tool === 'hardhat') {
          toolResult = await this.hardhatClient.runTests();
        } else if (toolCall.tool === 'octokit') {
          toolResult = await this.octokitClient.createPR('your-org/cuttlefish-ai', toolCall.params.branch || 'feature-widget', toolCall.params.code, toolCall.params.filePath);
        } else if (toolCall.tool === 'ethers') {
          const abi = toolCall.params.address === config.daoAddress
            ? ['function vote(uint256 _proposalId, bool support) external']
            : ['function getReserveBalance() view returns (uint256)', 'function getDividends() view returns (uint256)'];
          toolResult = await this.ethersClient.interactWithContract(toolCall.params.address, toolCall.params.method, toolCall.params.params, abi);
        }
        output += JSON.stringify(toolResult) + '\n';
        this.auditLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Pipeline',
          model: this.defaultModel,
          prompt: `Execute tool: ${JSON.stringify(toolCall)}`,
          response: JSON.stringify(toolResult),
          tokens: estimateTokens(JSON.stringify(toolResult)),
          confidence: 0.9,
        });
      } catch (error) {
        logger.error({ correlationId: this.correlationId, tool: toolCall.tool, error }, 'Tool execution failed');
        output += `Error: Tool ${toolCall.tool} failed\n`;
      }
    }

    // Verify
    this.taskState.step = 'verify';
    const verifyPrompt = `Verify execution for: ${userQuery}\nPlan: ${plan}\nOutput: ${output}\nContext: ${context}\nOutput JSON: { "verified": boolean, "issues": string[] }`;
    const verifyResult = await this.llmClient.generate(verifyPrompt, { maxTokens: 200, model: this.defaultModel });
    this.taskState.verificationResults.push(verifyResult.content);
    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      layer: 'Pipeline',
      model: this.defaultModel,
      prompt: verifyPrompt,
      response: verifyResult.content,
      tokens: estimateTokens(verifyResult.content),
      confidence: verifyResult.confidence,
    });

    let verified = false;
    try {
      const parsedVerify = JSON.parse(verifyResult.content);
      verified = parsedVerify.verified;
      if (!verified) {
        // Refine
        this.taskState.step = 'refine';
        const refinePrompt = `Refine plan for: ${userQuery}\nIssues: ${JSON.stringify(parsedVerify.issues)}\nOriginal Plan: ${plan}\nContext: ${context}\nOutput JSON: { "refined_plan": string }`;
        const refineResult = await this.llmClient.generate(refinePrompt, { maxTokens: 500, model: this.defaultModel });
        this.taskState.previousPlans.push(JSON.parse(refineResult.content).refined_plan);
        this.auditLogs.push({
          timestamp: new Date().toISOString(),
          layer: 'Pipeline',
          model: this.defaultModel,
          prompt: refinePrompt,
          response: refineResult.content,
          tokens: estimateTokens(refineResult.content),
          confidence: refineResult.confidence,
        });
        output = JSON.parse(refineResult.content).refined_plan;
      }
    } catch (error) {
      logger.error({ correlationId: this.correlationId, error }, 'Verification or refinement failed');
      output = 'Error: Verification failed';
    }

    metrics.success = verified;
    logger.info({ correlationId: this.correlationId, metrics }, 'Pipeline completed');
    return output;
  }
}