import { MemoryDatabase } from '../db/database.js';
import { EmbeddingClient } from '../embedding/client.js';

export interface SearchParams {
  query: string;
  types?: string[];
  limit?: number;
  project_path?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  type: string;
  importance: number;
  similarity: number;
  created_at: number;
}

export class SearchEngine {
  constructor(
    private db: MemoryDatabase,
    private embeddingClient: EmbeddingClient
  ) {}

  async search(params: SearchParams): Promise<SearchResult[]> {
    const queryVector = await this.embeddingClient.embed(params.query);

    const memories = this.db.getDb().prepare(`
      SELECT m.*, v.vector_id 
      FROM memories m
      LEFT JOIN vector_index v ON m.id = v.memory_id
      WHERE m.invalidated_at IS NULL
        ${params.types ? `AND m.type IN (${params.types.map(() => '?').join(',')})` : ''}
        ${params.project_path ? 'AND m.project_path = ?' : ''}
      ORDER BY m.created_at DESC
    `).all(...(params.types || []), ...(params.project_path ? [params.project_path] : []));

    const results: SearchResult[] = memories.map((memory: any) => ({
      id: memory.id,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      similarity: 0.5,
      created_at: memory.created_at
    }));

    results.sort((a, b) => {
      const scoreA = a.similarity * 0.4 + (a.importance / 2) * 0.2;
      const scoreB = b.similarity * 0.4 + (b.importance / 2) * 0.2;
      return scoreB - scoreA;
    });

    return results.slice(0, params.limit || 10);
  }
}
