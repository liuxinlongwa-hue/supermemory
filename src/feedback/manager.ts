import { MemoryDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

export class FeedbackManager {
  constructor(private db: MemoryDatabase) {}

  giveFeedback(memoryId: string, type: 'positive' | 'negative' | 'correction', comment?: string): string {
    const id = randomUUID();
    const now = Date.now();
    
    const stmt = this.db.getDb().prepare(`
      INSERT INTO feedback (id, memory_id, type, user_comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, memoryId, type, comment ?? null, now);

    this.updateQualityScore(memoryId);
    
    return id;
  }

  private updateQualityScore(memoryId: string) {
    const feedbacks = this.db.getDb().prepare(`
      SELECT type FROM feedback WHERE memory_id = ?
    `).all(memoryId);

    const positive = feedbacks.filter((f: any) => f.type === 'positive').length;
    const negative = feedbacks.filter((f: any) => f.type === 'negative').length;
    const total = feedbacks.length;

    const score = total > 0 ? (positive - negative * 0.5) / total : 0.5;
    const clampedScore = Math.max(0, Math.min(1, score));

    this.db.getDb().prepare(`
      UPDATE memories SET quality_score = ? WHERE id = ?
    `).run(clampedScore, memoryId);
  }

  triggerOptimization(): { processed: number } {
    const memories = this.db.getDb().prepare(`
      SELECT id FROM memories WHERE invalidated_at IS NULL
    `).all();

    let processed = 0;
    for (const memory of memories) {
      this.updateQualityScore((memory as any).id);
      processed++;
    }

    return { processed };
  }

  getFeedback(memoryId: string) {
    const stmt = this.db.getDb().prepare('SELECT * FROM feedback WHERE memory_id = ? ORDER BY created_at DESC');
    return stmt.all(memoryId);
  }
}