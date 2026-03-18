export const SCHEMA = `
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT,
  type TEXT NOT NULL CHECK(type IN ('episodic', 'semantic', 'procedural', 'project', 'session', 'habit')),
  importance INTEGER DEFAULT 0 CHECK(importance IN (0, 1, 2)),
  quality_score REAL DEFAULT 0.5 CHECK(quality_score >= 0 AND quality_score <= 1),
  
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  invalidated_at INTEGER,
  
  source_session_id TEXT,
  source_message_id TEXT,
  source_content TEXT,
  
  project_path TEXT,
  
  access_count INTEGER DEFAULT 0,
  last_accessed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project_path);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  aliases TEXT,
  canonical_id TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);

CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object_id TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  source_memory_id TEXT,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (subject_id) REFERENCES entities(id),
  FOREIGN KEY (object_id) REFERENCES entities(id)
);

CREATE INDEX IF NOT EXISTS idx_relations_subject ON relations(subject_id);
CREATE INDEX IF NOT EXISTS idx_relations_object ON relations(object_id);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('positive', 'negative', 'correction')),
  user_comment TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS vector_index (
  memory_id TEXT PRIMARY KEY,
  vector_id TEXT,
  embedding_model TEXT,
  dimensions INTEGER,
  created_at INTEGER NOT NULL
);
`;