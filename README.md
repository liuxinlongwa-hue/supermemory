# SuperMemory MCP Server

本地 MCP 记忆服务，为 AI Agent 提供跨会话的长期记忆能力。

## 特性

- **19 个 MCP 工具** - 完整的记忆管理工具集
- **向量搜索** - 基于语义相似度的记忆检索
- **知识图谱** - 实体关系管理和 1-2 跳推理
- **自学习优化** - 反馈驱动的质量评分系统
- **导入导出** - JSON 格式的数据迁移支持

## 安装

```bash
npm install
npm run build
```

## 配置

复制 `.env.example` 到 `.env` 并填写配置：

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

### 配置 Claude Desktop

在 `~/Library/Application Support/Claude/claude_desktop_config.json` 添加：

```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/path/to/supermemory/dist/index.js"],
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

## MCP 工具列表

### 核心操作

| 工具 | 描述 |
|------|------|
| `add_memory` | 添加新记忆 |
| `search_memory` | 搜索记忆（向量搜索） |
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

## 架构

```
src/
├── db/
│   ├── schema.ts        # 数据库 schema
│   └── database.ts      # 数据库管理
├── embedding/
│   └── client.ts        # Embedding API 客户端
├── memory/
│   ├── manager.ts       # 记忆管理器
│   └── search.ts        # 搜索引擎
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
- `entities` - 实体表
- `relations` - 关系表
- `feedback` - 反馈表
- `vector_index` - 向量索引

## License

ISC