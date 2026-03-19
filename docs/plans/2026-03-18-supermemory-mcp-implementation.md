# SuperMemory MCP Server 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建本地 MCP 记忆服务，为 AI Agent 提供跨会话的长期记忆能力

**Architecture:** TypeScript + MCP SDK + SQLite + 向量搜索(API) + 轻量知识图谱

**Tech Stack:** 
- TypeScript
- @modelcontextprotocol/sdk
- better-sqlite3
- OpenAI API (或兼容 API)

---

## Phase 1: 项目初始化与核心存储 (P0)

### Task 1.1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `src/index.ts`

**Step 1: 初始化 npm 项目**

```bash
npm init -y
npm install @modelcontextprotocol/sdk better-sqlite3 dotenv
npm install -D @types/node @types/better-sqlite3 typescript tsx
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: 创建 .env.example**

```env
# LLM 配置（用于总结、实体提取）
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=your-key
LLM_MODEL_ID=glm-4-flash

# Embedding 配置（用于语义搜索）
EMBEDDING_BASE_URL=https://open.bigmodel.cn/api/paas/v4
EMBEDDING_API_KEY=your-key
EMBEDDING_MODEL_ID=embedding-3

# 存储路径
MEMORY_DB_PATH=~/.supermemory/memory.db

# 检索配置
DEFAULT_SEARCH_LIMIT=10
TOKEN_BUDGET=2000
```

**Step 4: 创建 MCP Server 骨架**

```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  {
    name: 'supermemory',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'add_memory',
        description: '添加新记忆',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '记忆内容' },
            type: { 
              type: 'string', 
              enum: ['episodic', 'semantic', 'procedural', 'project', 'session', 'habit'],
              description: '记忆类型'
            },
            importance: { type: 'number', enum: [0, 1, 2], description: '重要性等级' },
            project_path: { type: 'string', description: '项目路径（可选）' }
          },
          required: ['content', 'type']
        }
      }
    ]
  };
});

// 工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'add_memory':
      return {
        content: [{ type: 'text', text: 'Memory added successfully' }]
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SuperMemory MCP Server running on stdio');
}

main().catch(console.error);
```

**Step 5: 添加 npm scripts**

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  }
}
```

**Step 6: 测试运行**

```bash
npm run dev
```

Expected: "SuperMemory MCP Server running on stdio"

**Step 7: Commit**

```bash
git add .
git commit -m "feat: initialize MCP server project"
```

---

### Task 1.2: SQLite 数据库初始化

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/database.ts`

**Step 1: 创建数据库 schema**

```typescript
// src/db/schema.ts
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
```

**Step 2: 创建数据库管理类**

```typescript
// src/db/database.ts
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
    
    // 确保目录存在
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(resolvedPath);
    this.initialize();
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
```

**Step 3: 集成到 MCP Server**

```typescript
// src/index.ts (修改)
import { MemoryDatabase } from './db/database.js';

const db = new MemoryDatabase(process.env.MEMORY_DB_PATH);

// ... 在 main() 函数末尾添加
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
```

**Step 4: 测试数据库初始化**

```bash
npm run dev
```

Expected: 数据库文件创建在 ~/.supermemory/memory.db

**Step 5: Commit**

```bash
git add src/db/
git commit -m "feat: add SQLite database schema and initialization"
```

---

### Task 1.3: 实现 add_memory 工具

**Files:**
- Create: `src/memory/manager.ts`
- Modify: `src/index.ts`

**Step 1: 创建记忆管理器**

```typescript
// src/memory/manager.ts
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
```

**Step 2: 集成到 MCP Server**

```typescript
// src/index.ts (修改)
import { MemoryManager } from './memory/manager.js';

const db = new MemoryDatabase(process.env.MEMORY_DB_PATH);
const memoryManager = new MemoryManager(db);

// 修改 add_memory 工具处理
case 'add_memory':
  const memoryId = memoryManager.addMemory(args as any);
  return {
    content: [{ 
      type: 'text', 
      text: `Memory added successfully. ID: ${memoryId}` 
    }]
  };
```

**Step 3: 测试 add_memory**

手动测试（通过 MCP Inspector 或 Claude Desktop）

**Step 4: Commit**

```bash
git add src/memory/
git commit -m "feat: implement add_memory tool"
```

---

## Phase 2: 检索引擎 (P0)

### Task 2.1: 向量搜索集成

**Files:**
- Create: `src/embedding/client.ts`
- Create: `src/memory/search.ts`

**Step 1: 创建 Embedding 客户端**

```typescript
// src/embedding/client.ts
export interface EmbeddingConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export class EmbeddingClient {
  constructor(private config: EmbeddingConfig) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelId,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelId,
        input: texts
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}
```

**Step 2: 创建搜索引擎**

```typescript
// src/memory/search.ts
import { MemoryDatabase } from '../db/database.js';
import { EmbeddingClient } from '../embedding/client.js';

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
  constructor(
    private db: MemoryDatabase,
    private embeddingClient: EmbeddingClient
  ) {}

  async search(params: SearchParams): Promise<SearchResult[]> {
    // 1. 生成查询向量
    const queryVector = await this.embeddingClient.embed(params.query);

    // 2. 获取所有记忆的向量
    const memories = this.db.getDb().prepare(`
      SELECT m.*, v.vector_id 
      FROM memories m
      LEFT JOIN vector_index v ON m.id = v.memory_id
      WHERE m.invalidated_at IS NULL
        ${params.types ? `AND m.type IN (${params.types.map(() => '?').join(',')})` : ''}
        ${params.project_path ? 'AND m.project_path = ?' : ''}
      ORDER BY m.created_at DESC
    `).all(...(params.types || []), ...(params.project_path ? [params.project_path] : []));

    // 3. 计算相似度（简化版，实际应该用向量数据库）
    const results: SearchResult[] = memories.map((memory: any) => ({
      id: memory.id,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      similarity: 0.5, // 占位符，实际需要计算余弦相似度
      created_at: memory.created_at
    }));

    // 4. 重排序
    results.sort((a, b) => {
      const scoreA = a.similarity * 0.4 + (a.importance / 2) * 0.2;
      const scoreB = b.similarity * 0.4 + (b.importance / 2) * 0.2;
      return scoreB - scoreA;
    });

    // 5. 截断
    return results.slice(0, params.limit || 10);
  }
}
```

**Step 3: 集成到 MCP Server**

```typescript
// src/index.ts (修改)
import { EmbeddingClient } from './embedding/client.js';
import { SearchEngine } from './memory/search.js';

const embeddingClient = new EmbeddingClient({
  baseUrl: process.env.EMBEDDING_BASE_URL!,
  apiKey: process.env.EMBEDDING_API_KEY!,
  modelId: process.env.EMBEDDING_MODEL_ID!
});

const searchEngine = new SearchEngine(db, embeddingClient);

// 添加 search_memory 工具
{
  name: 'search_memory',
  description: '搜索记忆',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索查询' },
      types: { type: 'array', items: { type: 'string' }, description: '记忆类型过滤' },
      limit: { type: 'number', description: '返回数量限制' },
      project_path: { type: 'string', description: '项目路径过滤' }
    },
    required: ['query']
  }
}

// 处理 search_memory
case 'search_memory':
  const results = await searchEngine.search(args as any);
  return {
    content: [{ 
      type: 'text', 
      text: JSON.stringify(results, null, 2)
    }]
  };
```

**Step 4: Commit**

```bash
git add src/embedding/ src/memory/search.ts
git commit -m "feat: implement vector search engine"
```

---

## Phase 3: 完整 MCP Tools 实现 (P1)

### Task 3.1: 实现所有 19 个工具

**Files:**
- Modify: `src/index.ts`
- Modify: `src/memory/manager.ts`

**Step 1: 添加剩余工具定义**

在 `ListToolsRequestSchema` 处理器中添加所有 19 个工具的定义。

**Step 2: 实现工具处理逻辑**

在 `CallToolRequestSchema` 处理器中添加所有工具的处理逻辑。

**Step 3: 测试所有工具**

逐个测试每个工具的功能。

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement all 19 MCP tools"
```

---

## Phase 4: 知识图谱 (P1)

### Task 4.1: 实体和关系管理

**Files:**
- Create: `src/graph/manager.ts`

**Step 1: 创建图管理器**

```typescript
// src/graph/manager.ts
import { MemoryDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

export class GraphManager {
  constructor(private db: MemoryDatabase) {}

  addEntity(name: string, type?: string, aliases?: string[]) {
    const id = randomUUID();
    const stmt = this.db.getDb().prepare(`
      INSERT INTO entities (id, name, type, aliases)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, type ?? null, JSON.stringify(aliases ?? []));
    return id;
  }

  addRelation(subjectId: string, predicate: string, objectId: string, sourceMemoryId?: string) {
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
    // 1-hop
    if (depth === 1) {
      return this.db.getDb().prepare(`
        SELECT r.*, e1.name as subject_name, e2.name as object_name
        FROM relations r
        JOIN entities e1 ON r.subject_id = e1.id
        JOIN entities e2 ON r.object_id = e2.id
        WHERE r.subject_id = ? OR r.object_id = ?
      `).all(entityId, entityId);
    }
    
    // 2-hop (简化实现)
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
```

**Step 2: 集成到 MCP Server**

**Step 3: Commit**

```bash
git add src/graph/
git commit -m "feat: implement knowledge graph"
```

---

## Phase 5: 自学习与质量评估 (P1)

### Task 5.1: 反馈系统

**Files:**
- Create: `src/feedback/manager.ts`

**Step 1: 创建反馈管理器**

```typescript
// src/feedback/manager.ts
import { MemoryDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

export class FeedbackManager {
  constructor(private db: MemoryDatabase) {}

  giveFeedback(memoryId: string, type: 'positive' | 'negative' | 'correction', comment?: string) {
    const id = randomUUID();
    const now = Date.now();
    
    const stmt = this.db.getDb().prepare(`
      INSERT INTO feedback (id, memory_id, type, user_comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, memoryId, type, comment ?? null, now);

    // 更新记忆质量评分
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
}
```

**Step 2: Commit**

```bash
git add src/feedback/
git commit -m "feat: implement feedback and quality system"
```

---

## Phase 6: 导入导出 (P2)

### Task 6.1: 导入导出功能

**Files:**
- Create: `src/export/manager.ts`

**Step 1: 创建导出管理器**

```typescript
// src/export/manager.ts
import { MemoryDatabase } from '../db/database.js';
import fs from 'fs';

export class ExportManager {
  constructor(private db: MemoryDatabase) {}

  exportMemory(format: 'json' = 'json'): string {
    const memories = this.db.getDb().prepare('SELECT * FROM memories').all();
    const entities = this.db.getDb().prepare('SELECT * FROM entities').all();
    const relations = this.db.getDb().prepare('SELECT * FROM relations').all();

    const data = {
      version: '1.0',
      exported_at: Date.now(),
      memories,
      entities,
      relations
    };

    return JSON.stringify(data, null, 2);
  }

  importMemory(data: string, format: 'json' = 'json') {
    const parsed = JSON.parse(data);
    
    // 批量插入
    const insertMemory = this.db.getDb().prepare(`
      INSERT OR REPLACE INTO memories VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const memory of parsed.memories) {
      insertMemory.run(...Object.values(memory));
    }

    return { imported: parsed.memories.length };
  }
}
```

**Step 2: Commit**

```bash
git add src/export/
git commit -m "feat: implement import/export functionality"
```

---

## 最终测试与部署

### Task 7.1: 集成测试

**Step 1: 创建测试脚本**

测试所有 19 个工具的功能。

**Step 2: 性能测试**

测试大量记忆的检索性能。

**Step 3: 文档更新**

更新 README.md，添加使用说明。

**Step 4: 最终 Commit**

```bash
git add .
git commit -m "chore: final integration and documentation"
```

---

## 配置 Claude Desktop

在 `~/Library/Application Support/Claude/claude_desktop_config.json` 添加：

```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/Users/shashademac/Desktop/supermemory/dist/index.js"],
      "env": {
        "LLM_BASE_URL": "https://open.bigmodel.cn/api/paas/v4",
        "LLM_API_KEY": "your-key",
        "LLM_MODEL_ID": "glm-4-flash",
        "EMBEDDING_BASE_URL": "https://open.bigmodel.cn/api/paas/v4",
        "EMBEDDING_API_KEY": "your-key",
        "EMBEDDING_MODEL_ID": "embedding-3",
        "MEMORY_DB_PATH": "~/.supermemory/memory.db",
        "DEFAULT_SEARCH_LIMIT": "10",
        "TOKEN_BUDGET": "2000"
      }
    }
  }
}
```

---

**实现计划完成。预计总时间：5 天。**
