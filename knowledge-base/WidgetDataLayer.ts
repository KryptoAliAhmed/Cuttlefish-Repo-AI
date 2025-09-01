import { LLMClient, LLMModel } from '../../llm/LLMClient';

export const WidgetDataLayer: CWALayerConfig = {
  name: 'Widget Data',
  generateContent: async (data, _llmClient: LLMClient, model: LLMModel) => {
    const mockData = { co2: "900,000", mw: "6", daos: "3" };
    try {
      const res = await fetch(data.widgetDataSource || 'https://your-api.com/widget-data.json');
      const json = await res.json();
      return { content: JSON.stringify(json), confidence: 0.95 };
    } catch (error) {
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
    return JSON.stringify({ co2: "900,000", mw: "6", daos: "3" });
  },
};