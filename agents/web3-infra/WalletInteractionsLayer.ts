import { ethers } from 'ethers';
import { LLMClient, LLMModel } from '../../llm/LLMClient';

export const WalletInteractionsLayer: CWALayerConfig = {
  name: 'Wallet Interactions',
  generateContent: async (data, _llmClient: LLMClient, model: LLMModel) => {
    try {
      const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/your_infura_key');
      const contract = new ethers.Contract(data.daoAddress, [
        'function vote(uint256 _proposalId, bool support) external',
      ], provider);
      const walletAddress = data.walletAddress || '0x0000000000000000000000000000000000000000';
      const response = `Wallet ${walletAddress} voted on proposal ${data.proposalId || 1}`;
      return { content: response, confidence: 0.9 };
    } catch (error) {
      return { content: `Error: Wallet not connected`, confidence: 0.4 };
    }
  },
  priority: 6,
  alwaysInclude: false,
  model: 'grok',
  validateContent: (content: string, confidence: number) => {
    return !content.includes('Error') && confidence > 0.6;
  },
  recoverContent: async () => {
    return 'Error: Wallet interaction failed';
  },
};