# SuperMemory MCP Server 设计文档

**日期**: 2026-03-18  
**版本**: 1.0  
**状态**: 设计完成，待实现

---

## 1. 项目概述

### 1.1 目标

构建本地 MCP (Model Context Protocol) 记忆服务，为 AI Agent 提供跨会话的长期记忆能力。

### 1.2 核心需求

1. **本地存储**：所有数据存储在本地，无需云服务
2. **超级省 Token**：智能检索，只返回高相关度结果
3. **无幻觉**：只存事实，完整来源追溯
4. **不遗忘**：分级优先级，重要信息强制保留
5. **多会话共享**：所有 AI 会话共享同一记忆库

### 1.3 架构选择

**方案 B（平衡版）**：
- SQLite（主存储）+ 向量搜索（API）+ 轻量知识图谱 + MCP Tools
- 用户可配置 LLM/Embedding API（兼容 OpenAI/GLM/DeepSeek 等）
- Agent 负责总结，MCP 只负责存储和检索

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Server (主接口)                    │
│  - 19 个 MCP Tools                                       │
│  - 用户可配置 LLM/Embedding API                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Memory Engine Core (记忆引擎)               │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  记忆管理器      │  │  检索引擎        │              │
│  │  - 写入/更新     │  │  - 混合检索      │              │
│  │  - 优先级管理    │  │  - 重排序        │              │
│  │  - 时态管理      │  │  - Token 预算    │              │
│  └─────────────────┘  └─────────────────┘              │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  巩固服务        │  │  自学习引擎      │              │
│  │  - 合并/去重     │  │  - 反馈收集      │              │
│  │  - 摘要/修剪     │  │  - 质量优化      │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   存储层 (全本地)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ SQLite       │  │ Vector Index │  │ 知识图谱      │  │
│  │ (主存储)     │  │ (API)        │  │ (邻接表)      │  │
│  │ - memories   │  │ - Embedding  │  │ - entities   │  │
│  │ - entities   │  │ - 语义搜索   │  │ - relations  │  │
│  │ - relations  │  │              │  │ - 1-2跳推理  │  │
│  │ - feedback   │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  LLM API (用户可配置)                     │
│  - 用于总结、实体提取（可选）                             │
│  - 兼容 OpenAI/GLM/DeepSeek 等                           │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 记忆类型与数据模型

### 3.1 六种记忆类型

| 类型 | 用途 | 生命周期 | 示例 |
|------|------|----------|------|
| **Episodic** (情景) | 对话片段、事件 | 7-30天衰减 | "用户昨天问过Redis配置" |
| **Semantic** (语义) | 事实知识 | 永久 | "用户偏好 TypeScript" |
| **Procedural** (程序) | 操作习惯 | 永久 | "用户喜欢用 git worktree" |
| **Project** (项目) | 项目上下文 | 项目绑定 | "这个项目用 Next.js 14" |
| **Session** (会话) | 当前任务 | 会话结束清理 | "正在调试 auth bug" |
| **Habit** (习惯) | 用户行为模式 | 永久 | "用户晚上10点后少回复" |

### 3.2 核心数据表

```sql
-- 记忆主表
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,              -- 记忆内容
  summary TEXT,                       -- LLM 总结
  type TEXT NOT NULL,                 -- episodic/semantic/procedural/project/session/habit
  importance INTEGER DEFAULT 0,       -- 0=普通, 1=重要, 2=关键
  quality_score REAL DEFAULT 0.5,     -- 质量评分 0-1
  
  -- 时态字段
  created_at INTEGER NOT NULL,
  expires_at INTEGER,                 -- TTL 过期时间
  invalidated_at INTEGER,             -- 失效时间
  
  -- 来源追溯
  source_session_id TEXT,
  source_message_id TEXT,
  source_content TEXT,                -- 原始对话内容
  
  -- 项目绑定
  project_path TEXT,
  
  -- 访问统计
  access_count INTEGER DEFAULT 0,
  last_accessed_at INTEGER
);

-- 实体表
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,                          -- person/project/tech/concept
  aliases TEXT,                       -- JSON 数组，别名列表
  canonical_id TEXT,                  -- 指向规范实体（消歧）
  metadata TEXT                       -- JSON 额外信息
);

-- 关系表（知识图谱）
CREATE TABLE relations (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,           -- 主体实体 ID
  predicate TEXT NOT NULL,            -- 关系类型
  object_id TEXT NOT NULL,            -- 客体实体 ID
  confidence REAL DEFAULT 1.0,
  source_memory_id TEXT,              -- 来源记忆
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (subject_id) REFERENCES entities(id),
  FOREIGN KEY (object_id) REFERENCES entities(id)
);

-- 反馈表（自学习）
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  type TEXT NOT NULL,                 -- positive/negative/correction
  user_comment TEXT,
  created_at INTEGER NOT NULL
);

-- 向量索引元数据（实际向量存 API 端或单独表）
CREATE TABLE vector_index (
  memory_id TEXT PRIMARY KEY,
  vector_id TEXT,                     -- 向量数据库中的 ID
  embedding_model TEXT,               -- 使用的模型
  dimensions INTEGER,
  created_at INTEGER NOT NULL
);
```

---

## 4. 检索策略

### 4.1 混合检索流程

```
查询 → 并行执行
        ├── 向量检索 (语义相似)
        ├── BM25 检索 (关键词)
        └── 图遍历 (关系关联)
            ↓
        结果融合
            ↓
        重排序
            ├── 相关度权重 40%
            ├── 时效性权重 30%
            ├── 重要性权重 20%
            └── 质量评分 10%
            ↓
        Token 预算截断
```

### 4.2 Token 预算分配

| 记忆类型 | 预算占比 | 说明 |
|----------|----------|------|
| Semantic | 40% | 长期事实优先 |
| Project | 30% | 当前项目上下文 |
| Session | 20% | 会话短期记忆 |
| Episodic | 10% | 情景记忆补充 |

---

## 5. MCP 工具定义

```typescript
// 核心操作
add_memory(content, type, importance?, project_path?)
search_memory(query, types?, limit?, project_path?)
get_memory(id)
delete_memory(id)

// 分类检索
get_project_memories(project_path)
get_long_term_memories()
get_recent_memories(hours?)

// 重要管理
mark_important(id, level)  // level: 0/1/2
get_important_memories()

// 关系推理
add_relation(subject, predicate, object)
query_relations(entity, depth?)  // 1-2 跳

// 时态管理
invalidate_fact(id, reason?)
query_timeline(from, to)

// 自学习
give_feedback(memory_id, type, comment?)
trigger_optimization()

// 导入导出
export_memory(format?)
import_memory(data, format?)
```

---

## 6. 用户配置

```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/path/to/supermemory/dist/index.js"],
      "env": {
        // LLM 配置（用于总结、实体提取）
        "LLM_BASE_URL": "https://open.bigmodel.cn/api/paas/v4",
        "LLM_API_KEY": "your-key",
        "LLM_MODEL_ID": "glm-4-flash",
        
        // Embedding 配置（用于语义搜索）
        "EMBEDDING_BASE_URL": "https://open.bigmodel.cn/api/paas/v4",
        "EMBEDDING_API_KEY": "your-key",
        "EMBEDDING_MODEL_ID": "embedding-3",
        
        // 存储路径
        "MEMORY_DB_PATH": "~/.supermemory/memory.db",
        
        // 检索配置
        "DEFAULT_SEARCH_LIMIT": "10",
        "TOKEN_BUDGET": "2000"
      }
    }
  }
}
```

---

## 7. 防幻觉机制

1. **只存事实**：禁止 LLM 推断，只存储用户明确陈述的内容
2. **完整来源追溯**：
   - `source_session_id`: 来源会话 ID
   - `source_message_id`: 来源消息 ID
   - `source_content`: 原始对话内容
3. **冲突检测**：检测矛盾记忆，提示用户确认
4. **质量评分**：四维评估（准确性、有用性、时效性、可验证性）

---

## 8. 防遗忘机制

1. **分级优先级**：
   - `0`: 普通记忆（可衰减）
   - `1`: 重要记忆（延长保留）
   - `2`: 关键记忆（永久保留）

2. **强制保留**：
   - `expires_at`: TTL 过期时间
   - `pin_until`: 强制保留至指定时间

3. **定期提醒**：重要信息定期注入检索结果

---

## 9. 关系推理能力

1. **基于规则的关系提取**（零 LLM 调用）：
   - 模式匹配：`X 使用 Y`、`X 是 Y 的作者`
   - 实体识别：人名、项目名、技术栈

2. **多跳推理**（1-2 跳）：
   - 1 跳：`用户 → 偏好 → TypeScript`
   - 2 跳：`用户 → 偏好 → TypeScript → 相关 → React`

3. **实体消歧**：
   - `canonical_id`: 指向规范实体
   - `aliases`: 别名列表

---

## 10. 自学习优化

1. **反馈驱动**：
   - 正向反馈：提升质量评分
   - 负向反馈：降低质量评分
   - 修正反馈：更新记忆内容

2. **访问频率**：
   - 高频访问：自动提升重要性
   - 低频访问：自动降级

3. **质量评估**：
   - 准确性：是否与事实一致
   - 有用性：是否被频繁使用
   - 时效性：是否过时
   - 可验证性：是否有来源追溯

---

## 11. 实现时间表

### Phase 1: 核心存储 (P0) - 1 天
- SQLite 数据库初始化
- 基础 CRUD 操作
- MCP Server 骨架

### Phase 2: 检索引擎 (P0) - 1 天
- 向量搜索集成（API）
- BM25 关键词搜索
- 混合检索 + 重排序

### Phase 3: 知识图谱 (P1) - 1 天
- 实体表 + 关系表
- 1-2 跳推理
- 实体消歧

### Phase 4: 自学习 (P1) - 1 天
- 反馈系统
- 质量评估
- 自动优化

### Phase 5: 时态管理 (P1) - 0.5 天
- TTL 过期
- 失效标记
- 时间线查询

### Phase 6: 导入导出 (P2) - 0.5 天
- JSON 格式导出
- 批量导入

**总计**: 5 天

---

## 12. 技术栈

- **语言**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **数据库**: SQLite (better-sqlite3)
- **向量搜索**: OpenAI API (或兼容 API)
- **Embedding**: 用户可配置（OpenAI/GLM/DeepSeek）

---

## 13. 成功标准

1. ✅ 所有 19 个 MCP Tools 正常工作
2. ✅ 检索准确率 > 90%
3. ✅ Token 消耗降低 50%+
4. ✅ 无幻觉（来源可追溯）
5. ✅ 重要信息不遗忘
6. ✅ 多会话共享记忆

---

**设计完成，等待用户批准后进入实现阶段。**
