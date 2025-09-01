export type LLMModel = 'claude' | 'gemini' | 'grok' | 'gpt';

export interface ToolCall {
  tool: 'hardhat' | 'octokit' | 'ethers';
  action: string;
  params: any;
}

export interface AuditLog {
  timestamp: string;
  layer: string;
  model: LLMModel;
  prompt: string;
  response: string;
  tokens: number;
  confidence: number;
}

export interface TaskState {
  step: 'plan' | 'execute' | 'verify' | 'refine';
  previousPlans: string[];
  verificationResults: string[];
  lastValidState?: string;
}

export interface Metrics {
  stepLatency: number;
  llmTokensUsed: { [model: string]: number };
  success: boolean;
  confidenceScores: { [layer: string]: number };
}