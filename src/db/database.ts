import Database from 'better-sqlite3';
import { SCHEMA } from './schema.js';
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
  }

  getDb() {
    return this.db;
  }

  close() {
    this.db.close();
  }
}