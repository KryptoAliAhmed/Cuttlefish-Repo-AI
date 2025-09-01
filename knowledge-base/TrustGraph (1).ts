import { readFileSync } from 'fs';
import { join } from 'path';

export class TrustGraph {
  async query(_query: string) {
    const mockData = JSON.parse(readFileSync(join(__dirname, '../../data/mock_rag_data.json'), 'utf-8'));
    return mockData;
  }
}

export class VectorDB {
  async search(_query: string) {
    return ['mock vector result'];
  }
}