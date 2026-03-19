import { MemoryDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

export class GraphManager {
  constructor(private db: MemoryDatabase) {}

  addEntity(name: string, type?: string, aliases?: string[]): string {
    const id = randomUUID();
    const stmt = this.db.getDb().prepare(`
      INSERT INTO entities (id, name, type, aliases)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, type ?? null, JSON.stringify(aliases ?? []));
    return id;
  }

  getEntity(id: string) {
    const stmt = this.db.getDb().prepare('SELECT * FROM entities WHERE id = ?');
    return stmt.get(id);
  }

  getEntityByName(name: string) {
    const stmt = this.db.getDb().prepare('SELECT * FROM entities WHERE name = ?');
    return stmt.get(name);
  }

  addRelation(subjectId: string, predicate: string, objectId: string, sourceMemoryId?: string): string {
    const id = randomUUID();
    const now = Date.now();
    const stmt = this.db.getDb().prepare(`
      INSERT INTO relations (id, subject_id, predicate, object_id, source_memory_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, subjectId, predicate, objectId, sourceMemoryId ?? null, now);
    return id;
  }

  queryRelations(entityId: string, depth: number = 1): any[] {
    if (depth === 1) {
      return this.db.getDb().prepare(`
        SELECT r.*, e1.name as subject_name, e2.name as object_name
        FROM relations r
        JOIN entities e1 ON r.subject_id = e1.id
        JOIN entities e2 ON r.object_id = e2.id
        WHERE r.subject_id = ? OR r.object_id = ?
      `).all(entityId, entityId);
    }
    
    const oneHop = this.queryRelations(entityId, 1);
    const connectedIds = oneHop.map((r: any) => 
      r.subject_id === entityId ? r.object_id : r.subject_id
    );
    
    const twoHop = connectedIds.flatMap((id: string) => 
      this.queryRelations(id, 1)
    );
    
    return [...oneHop, ...twoHop];
  }
}