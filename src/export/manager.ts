import { MemoryDatabase } from '../db/database.js';

export class ExportManager {
  constructor(private db: MemoryDatabase) {}

  exportMemory(format: 'json' = 'json'): string {
    const memories = this.db.getDb().prepare('SELECT * FROM memories').all();
    const entities = this.db.getDb().prepare('SELECT * FROM entities').all();
    const relations = this.db.getDb().prepare('SELECT * FROM relations').all();
    const feedback = this.db.getDb().prepare('SELECT * FROM feedback').all();

    const data = {
      version: '1.0',
      exported_at: Date.now(),
      memories,
      entities,
      relations,
      feedback
    };

    return JSON.stringify(data, null, 2);
  }

  importMemory(data: string, format: 'json' = 'json'): { imported: number } {
    const parsed = JSON.parse(data);
    
    let imported = 0;

    if (parsed.memories && Array.isArray(parsed.memories)) {
      const insertMemory = this.db.getDb().prepare(`
        INSERT OR REPLACE INTO memories (
          id, content, summary, type, importance, quality_score,
          created_at, expires_at, invalidated_at,
          source_session_id, source_message_id, source_content,
          project_path, access_count, last_accessed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const memory of parsed.memories) {
        insertMemory.run(
          memory.id,
          memory.content,
          memory.summary ?? null,
          memory.type,
          memory.importance ?? 0,
          memory.quality_score ?? 0.5,
          memory.created_at,
          memory.expires_at ?? null,
          memory.invalidated_at ?? null,
          memory.source_session_id ?? null,
          memory.source_message_id ?? null,
          memory.source_content ?? null,
          memory.project_path ?? null,
          memory.access_count ?? 0,
          memory.last_accessed_at ?? null
        );
        imported++;
      }
    }

    if (parsed.entities && Array.isArray(parsed.entities)) {
      const insertEntity = this.db.getDb().prepare(`
        INSERT OR REPLACE INTO entities (id, name, type, aliases, canonical_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const entity of parsed.entities) {
        insertEntity.run(
          entity.id,
          entity.name,
          entity.type ?? null,
          entity.aliases ?? null,
          entity.canonical_id ?? null,
          entity.metadata ?? null
        );
      }
    }

    if (parsed.relations && Array.isArray(parsed.relations)) {
      const insertRelation = this.db.getDb().prepare(`
        INSERT OR REPLACE INTO relations (id, subject_id, predicate, object_id, confidence, source_memory_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const relation of parsed.relations) {
        insertRelation.run(
          relation.id,
          relation.subject_id,
          relation.predicate,
          relation.object_id,
          relation.confidence ?? 1.0,
          relation.source_memory_id ?? null,
          relation.created_at
        );
      }
    }

    return { imported };
  }
}