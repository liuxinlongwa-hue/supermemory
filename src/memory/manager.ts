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

  deleteMemory(id: string): boolean {
    const stmt = this.db.getDb().prepare('DELETE FROM memories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getProjectMemories(projectPath: string) {
    const stmt = this.db.getDb().prepare(`
      SELECT * FROM memories 
      WHERE project_path = ? AND invalidated_at IS NULL
      ORDER BY created_at DESC
    `);
    return stmt.all(projectPath);
  }

  getLongTermMemories() {
    // 重要等级 1 或 2 的记忆
    const stmt = this.db.getDb().prepare(`
      SELECT * FROM memories 
      WHERE importance >= 1 AND invalidated_at IS NULL
      ORDER BY importance DESC, created_at DESC
    `);
    return stmt.all();
  }

  getRecentMemories(hours?: number) {
    const cutoff = Date.now() - (hours ?? 24) * 60 * 60 * 1000;
    const stmt = this.db.getDb().prepare(`
      SELECT * FROM memories 
      WHERE created_at >= ? AND invalidated_at IS NULL
      ORDER BY created_at DESC
    `);
    return stmt.all(cutoff);
  }

  markImportant(id: string, level: number): boolean {
    if (level < 0 || level > 2) return false;
    const stmt = this.db.getDb().prepare('UPDATE memories SET importance = ? WHERE id = ?');
    const result = stmt.run(level, id);
    return result.changes > 0;
  }

  getImportantMemories() {
    const stmt = this.db.getDb().prepare(`
      SELECT * FROM memories 
      WHERE importance >= 1 AND invalidated_at IS NULL
      ORDER BY importance DESC, created_at DESC
    `);
    return stmt.all();
  }

  invalidateFact(id: string, reason?: string): boolean {
    const now = Date.now();
    const stmt = this.db.getDb().prepare(`
      UPDATE memories SET invalidated_at = ? WHERE id = ?
    `);
    const result = stmt.run(now, id);
    return result.changes > 0;
  }

  queryTimeline(from: number, to: number) {
    const stmt = this.db.getDb().prepare(`
      SELECT * FROM memories 
      WHERE created_at >= ? AND created_at <= ? AND invalidated_at IS NULL
      ORDER BY created_at ASC
    `);
    return stmt.all(from, to);
  }

  getAllMemories() {
    const stmt = this.db.getDb().prepare('SELECT * FROM memories WHERE invalidated_at IS NULL ORDER BY created_at DESC');
    return stmt.all();
  }
}