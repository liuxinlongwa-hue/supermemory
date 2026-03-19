# SuperMemory MCP Server

本地 MCP 记忆服务，为 AI Agent 提供跨会话的长期记忆能力。

## 特性

- **19 个 MCP 工具** - 完整的记忆管理工具集
- **纯本地向量搜索** - 使用 @xenova/transformers，无需 API Key
- **知识图谱** - 实体关系管理和 1-2 跳推理
- **自学习优化** - 反馈驱动的质量评分系统
- **导入导出** - JSON 格式的数据迁移支持

## 安装

```bash
npm install
npm run build
```

## 使用

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm run build
npm start
```

### 配置 OpenCode

在 `~/.config/opencode/opencode.json` 添加：

```json
{
  "mcp": {
    "supermemory": {
      "type": "local",
      "command": ["node", "/Users/shashademac/Desktop/supermemory/dist/index.js"],
      "enabled": true
    }
  }
}
```

### 配置 Claude Desktop

在 `~/Library/Application Support/Claude/claude_desktop_config.json` 添加：

```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/path/to/supermemory/dist/index.js"]
    }
  }
}
```

## 首次运行

首次运行时会自动下载 embedding 模型（~80MB）：
- 模型：`Xenova/all-MiniLM-L6-v2`
- 向量维度：384
- 下载位置：HuggingFace 缓存目录

## 数据存储

- **位置**: `~/.supermemory/memory.db`
- **格式**: SQLite 数据库
- **向量存储**: BLOB (Float32)

## MCP 工具列表

### 核心操作

| 工具 | 描述 |
|------|------|
| `add_memory` | 添加新记忆（自动向量化） |
| `search_memory` | 语义搜索（向量相似度） |
| `get_memory` | 获取指定记忆 |
| `delete_memory` | 删除记忆 |

### 分类检索

| 工具 | 描述 |
|------|------|
| `get_project_memories` | 获取项目相关记忆 |
| `get_long_term_memories` | 获取长期记忆（重要等级 1 或 2） |
| `get_recent_memories` | 获取最近记忆 |

### 重要管理

| 工具 | 描述 |
|------|------|
| `mark_important` | 标记记忆重要性（0/1/2） |
| `get_important_memories` | 获取重要记忆 |

### 关系推理

| 工具 | 描述 |
|------|------|
| `add_relation` | 添加实体关系 |
| `query_relations` | 查询实体关系（1-2 跳） |

### 时态管理

| 工具 | 描述 |
|------|------|
| `invalidate_fact` | 使记忆失效 |
| `query_timeline` | 按时间范围查询记忆 |

### 自学习

| 工具 | 描述 |
|------|------|
| `give_feedback` | 对记忆给出反馈 |
| `trigger_optimization` | 触发质量优化 |

### 导入导出

| 工具 | 描述 |
|------|------|
| `export_memory` | 导出记忆数据 |
| `import_memory` | 导入记忆数据 |

## 记忆类型

- `episodic` - 情景记忆（具体事件）
- `semantic` - 语义记忆（事实知识）
- `procedural` - 程序记忆（操作步骤）
- `project` - 项目记忆（项目相关）
- `session` - 会话记忆（对话上下文）
- `habit` - 习惯记忆（用户偏好）

## 重要性等级

- `0` - 普通记忆（可衰减）
- `1` - 重要记忆（延长保留）
- `2` - 关键记忆（永久保留）

## 技术架构

```
src/
├── db/
│   ├── schema.ts        # 数据库 schema
│   └── database.ts      # 数据库管理 + 向量操作
├── embedding/
│   ├── client.ts        # API Embedding 客户端
│   └── local-client.ts  # 本地 Embedding 客户端
├── memory/
│   ├── manager.ts       # 记忆管理器
│   └── search.ts        # 向量搜索引擎
├── graph/
│   └── manager.ts       # 知识图谱管理器
├── feedback/
│   └── manager.ts       # 反馈管理器
├── export/
│   └── manager.ts       # 导入导出管理器
└── index.ts             # MCP Server 入口
```

## 数据库表

- `memories` - 记忆存储
- `embeddings` - 向量索引
- `entities` - 实体表
- `relations` - 关系表
- `feedback` - 反馈表

## 依赖

- `@modelcontextprotocol/sdk` - MCP 协议
- `better-sqlite3` - SQLite 数据库
- `@xenova/transformers` - 本地 Embedding 模型

## License

ISC