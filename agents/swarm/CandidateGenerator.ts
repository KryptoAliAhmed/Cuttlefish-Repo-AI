export type Blueprint = { description: string; metrics: { financial: number; ecological: number; social: number }; isHighRisk?: boolean };

export interface CandidateGenerator {
  generate(topic: string, count: number): Promise<Blueprint[]>;
}

export class RandomCandidateGenerator implements CandidateGenerator {
  async generate(topic: string, count: number): Promise<Blueprint[]> {
    const arr: Blueprint[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        description: `${topic} plan v${i + 1}`,
        metrics: {
          financial: 50 + Math.floor(Math.random() * 50),
          ecological: 50 + Math.floor(Math.random() * 50),
          social: 50 + Math.floor(Math.random() * 50)
        },
        isHighRisk: Math.random() > 0.7
      });
    }
    return arr;
  }
}

export type LLMCaller = (prompt: string) => Promise<string>;

export class LLMCandidateGenerator implements CandidateGenerator {
  private callLLM: LLMCaller;
  constructor(callLLM: LLMCaller) {
    this.callLLM = callLLM;
  }
  async generate(topic: string, count: number): Promise<Blueprint[]> {
    const prompt = `Generate ${count} infrastructure blueprint candidates for topic: "${topic}".
Return JSON array with objects: { description, metrics: { financial (0-100), ecological (0-100), social (0-100) }, isHighRisk (boolean) }`;
    try {
      const text = await this.callLLM(prompt);
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((p, i) => ({
          description: p.description || `${topic} plan v${i + 1}`,
          metrics: {
            financial: Number(p?.metrics?.financial ?? 50),
            ecological: Number(p?.metrics?.ecological ?? 50),
            social: Number(p?.metrics?.social ?? 50)
          },
          isHighRisk: !!p.isHighRisk
        }));
      }
    } catch (_) {}
    // Fallback to random if parsing fails
    return new RandomCandidateGenerator().generate(topic, count);
  }
}


