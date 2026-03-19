import { MemoryDatabase } from '../db/database.js';
import { LocalEmbeddingClient } from '../embedding/local-client.js';

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
  private localEmbeddingClient: LocalEmbeddingClient | null = null;

  constructor(private db: MemoryDatabase) {
    this.localEmbeddingClient = new LocalEmbeddingClient();
  }

  async search(params: SearchParams): Promise<SearchResult[]> {
    let queryVector: number[] | null = null;
    
    if (this.localEmbeddingClient) {
      try {
        queryVector = await this.localEmbeddingClient.embed(params.query);
      } catch (e) {
        // Embedding 失败，使用关键词搜索
      }
    }

    if (queryVector) {
      return this.vectorSearch(params, queryVector);
    }

    return this.keywordSearch(params);
  }

  private async vectorSearch(params: SearchParams, queryVector: number[]): Promise<SearchResult[]> {
    const similar = this.db.searchSimilar(queryVector, params.limit || 10);
    
    if (similar.length === 0) {
      return this.keywordSearch(params);
    }

    const memoryIds = similar.map(s => s.memoryId);
    const placeholders = memoryIds.map(() => '?').join(',');
    
    const memories = this.db.getDb().prepare(`
      SELECT * FROM memories
      WHERE id IN (${placeholders})
        AND invalidated_at IS NULL
        ${params.types ? `AND type IN (${params.types.map(() => '?').join(',')})` : ''}
        ${params.project_path ? 'AND project_path = ?' : ''}
    `).all(...memoryIds, ...(params.types || []), ...(params.project_path ? [params.project_path] : [])) as any[];

    const similarityMap = new Map(similar.map(s => [s.memoryId, s.similarity]));

    const results: SearchResult[] = memories.map(memory => ({
      id: memory.id,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      similarity: similarityMap.get(memory.id) || 0,
      created_at: memory.created_at
    }));

    results.sort((a, b) => {
      const scoreA = a.similarity * 0.6 + (a.importance / 2) * 0.4;
      const scoreB = b.similarity * 0.6 + (b.importance / 2) * 0.4;
      return scoreB - scoreA;
    });

    return results.slice(0, params.limit || 10);
  }

  private keywordSearch(params: SearchParams): SearchResult[] {
    const memories = this.db.getDb().prepare(`
      SELECT * FROM memories
      WHERE invalidated_at IS NULL
        AND content LIKE ?
        ${params.types ? `AND type IN (${params.types.map(() => '?').join(',')})` : ''}
        ${params.project_path ? 'AND project_path = ?' : ''}
      ORDER BY importance DESC, created_at DESC
      LIMIT ?
    `).all(`%${params.query}%`, ...(params.types || []), ...(params.project_path ? [params.project_path] : []), params.limit || 10) as any[];

    return memories.map(memory => ({
      id: memory.id,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      similarity: 0.3,
      created_at: memory.created_at
    }));
  }

  async indexMemory(memoryId: string, content: string): Promise<void> {
    if (!this.localEmbeddingClient) return;

    try {
      const embedding = await this.localEmbeddingClient.embed(content);
      this.db.storeEmbedding(memoryId, embedding);
    } catch (e) {
      // 索引失败，静默处理
    }
  }
}