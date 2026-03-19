import Database from 'better-sqlite3';
import { SCHEMA, VECTOR_DIMENSIONS } from './schema.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

export class MemoryDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath 
      ? dbPath.replace('~', os.homedir())
      : path.join(os.homedir(), '.supermemory', 'memory.db');
    
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      this.db = new Database(resolvedPath);
      this.initialize();
    } catch (err) {
      throw new Error(`Failed to initialize database at ${resolvedPath}: ${err}`);
    }
  }

  private initialize() {
    this.db.exec(SCHEMA);
    this.insertDefaultMemories();
  }

  private insertDefaultMemories() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM memories').get() as any;
    
    if (count.count === 0) {
      const defaults = [
        {
          id: 'default-output-style',
          content: '记住信息时只需输出"✅已记住[简短内容]"即可，不要输出分析和解释过程',
          type: 'habit',
          importance: 2,
          created_at: Date.now()
        },
        {
          id: 'default-recall-behavior',
          content: '每次回答用户问题前，必须先调用 recall 工具检索相关记忆，以便获取上下文信息',
          type: 'habit',
          importance: 2,
          created_at: Date.now()
        }
      ];

      const stmt = this.db.prepare(`
        INSERT INTO memories (id, content, type, importance, created_at)
        VALUES (@id, @content, @type, @importance, @created_at)
      `);

      for (const memory of defaults) {
        stmt.run(memory);
      }
    }
  }

  getDb() {
    return this.db;
  }

  storeEmbedding(memoryId: string, embedding: number[]): void {
    const buffer = Buffer.from(new Float32Array(embedding).buffer);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO embeddings (memory_id, embedding, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(memoryId, buffer, Date.now());
  }

  searchSimilar(queryEmbedding: number[], limit: number = 10): any[] {
    const rows = this.db.prepare(`
      SELECT e.memory_id, e.embedding
      FROM embeddings e
      JOIN memories m ON e.memory_id = m.id
      WHERE m.invalidated_at IS NULL
    `).all() as any[];

    const similarities: { memoryId: string; similarity: number }[] = [];

    for (const row of rows) {
      const storedEmbedding = Array.from(
        new Float32Array(row.embedding.buffer)
      );
      const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding);
      similarities.push({ memoryId: row.memory_id, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  close() {
    this.db.close();
  }
}