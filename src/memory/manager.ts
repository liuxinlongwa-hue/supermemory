import { MemoryDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

export interface AddMemoryParams {
  content: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'project' | 'session' | 'habit';
  importance?: number;
  project_path?: string;
  source_session_id?: string;
  source_message_id?: string;
  source_content?: string;
}

export class MemoryManager {
  constructor(private db: MemoryDatabase) {}

  addMemory(params: AddMemoryParams): string {
    const id = randomUUID();
    const now = Date.now();
    
    const stmt = this.db.getDb().prepare(`
      INSERT INTO memories (
        id, content, type, importance, created_at,
        project_path, source_session_id, source_message_id, source_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.content,
      params.type,
      params.importance ?? 0,
      now,
      params.project_path ?? null,
      params.source_session_id ?? null,
      params.source_message_id ?? null,
      params.source_content ?? null
    );

    return id;
  }

  getMemory(id: string) {
    const stmt = this.db.getDb().prepare('SELECT * FROM memories WHERE id = ?');
    return stmt.get(id);
  }
}