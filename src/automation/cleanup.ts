import { MemoryDatabase } from '../db/database.js';
import { AutoMemoryConfig } from './config.js';

export interface CleanupStats {
  total: number;
  expired: number;
  lowQuality: number;
  kept: number;
}

export class Cleanup {
  private lastCleanup: number = 0;
  private isRunning: boolean = false;

  constructor(
    private db: MemoryDatabase,
    private config: AutoMemoryConfig
  ) {}

  async runIfNeeded(): Promise<CleanupStats | null> {
    const now = Date.now();
    const intervalMs = this.config.cleanupIntervalHours * 60 * 60 * 1000;

    if (now - this.lastCleanup < intervalMs) {
      return null;
    }

    if (this.isRunning) {
      return null;
    }

    this.isRunning = true;
    this.lastCleanup = now;

    try {
      return await this.performCleanup();
    } finally {
      this.isRunning = false;
    }
  }

  private async performCleanup(): Promise<CleanupStats> {
    const stats: CleanupStats = {
      total: 0,
      expired: 0,
      lowQuality: 0,
      kept: 0
    };

    const memories = this.db.getDb().prepare(`
      SELECT id, importance, quality_score, created_at, invalidated_at
      FROM memories
      WHERE invalidated_at IS NULL
    `).all() as any[];

    stats.total = memories.length;

    const now = Date.now();
    const ttlMs = this.config.maxMemoryTtlDays * 24 * 60 * 60 * 1000;

    for (const memory of memories) {
      const age = now - memory.created_at;
      const isExpired = age > ttlMs && memory.importance === 0;
      const isLowQuality = memory.quality_score < 0.3 && memory.importance === 0;

      if (isExpired) {
        this.db.getDb().prepare('DELETE FROM memories WHERE id = ?').run(memory.id);
        this.db.getDb().prepare('DELETE FROM embeddings WHERE memory_id = ?').run(memory.id);
        stats.expired++;
      } else if (isLowQuality) {
        this.db.getDb().prepare('DELETE FROM memories WHERE id = ?').run(memory.id);
        this.db.getDb().prepare('DELETE FROM embeddings WHERE memory_id = ?').run(memory.id);
        stats.lowQuality++;
      } else {
        stats.kept++;
      }
    }

    return stats;
  }

  forceCleanup(): Promise<CleanupStats> {
    this.lastCleanup = 0;
    return this.runIfNeeded() as Promise<CleanupStats>;
  }
}