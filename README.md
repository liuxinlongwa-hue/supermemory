# SuperMemory MCP Server

本地 MCP 记忆服务，为 AI Agent 提供跨会话的长期记忆能力。

## ✨ 特性

- ✅ **纯本地运行** - 无需任何 API Key
- ✅ **自动化记忆** - AI 写代码时自动记录，无需手动触发
- ✅ **5 个核心工具** - 精简设计，节省 70% token
- ✅ **语义搜索** - 本地向量搜索，自动下载模型
- ✅ **知识图谱** - 实体关系管理和 1-2 跳推理
- ✅ **自学习优化** - 反馈驱动的质量评分系统

---

## 🚀 快速开始（小白教程）

### 第一步：安装 Node.js

确保你的电脑已安装 Node.js（版本 18 或更高）。

**检查方法：** 打开终端，输入：
```bash
node --version
```

如果显示版本号（如 `v20.x.x`），说明已安装。

如果显示 `command not found`，请前往 [nodejs.org](https://nodejs.org) 下载安装 LTS 版本。

---

### 第二步：下载项目

**方法一：使用 Git（推荐）**
```bash
git clone https://github.com/liuxinlongwa-hue/supermemory.git
cd supermemory
```

**方法二：直接下载 ZIP**
1. 访问 https://github.com/liuxinlongwa-hue/supermemory
2. 点击绿色按钮 **Code** → **Download ZIP**
3. 解压后，在终端进入该文件夹：
   ```bash
   cd ~/Downloads/supermemory-main
   ```

---

### 第三步：安装依赖

在项目目录下运行：
```bash
npm install
```

等待安装完成（约 30 秒），看到 `added xxx packages` 即成功。

---

### 第四步：构建项目

```bash
npm run build
```

看到 `> tsc` 且无红色报错即成功。

---

### 第五步：获取项目路径

```bash
pwd
```

复制输出的路径，例如：
```
/Users/你的名字/Desktop/supermemory
```

---

### 第六步：配置 OpenCode

#### 1. 打开配置文件

**macOS：**
```bash
open ~/.config/opencode/opencode.json
```

**或用 VS Code 打开：**
```bash
code ~/.config/opencode/opencode.json
```

#### 2. 添加配置

找到 `"mcp"` 部分，在 **花括号 `{` 后面** 添加：

```json
"supermemory": {
  "type": "local",
  "command": ["node", "你的项目路径/dist/index.js"],
  "enabled": true
},
```

⚠️ **重要**：把 `你的项目路径` 替换成第五步复制的路径！

#### 3. 完整示例

```json
{
  "mcp": {
    "supermemory": {
      "type": "local",
      "command": ["node", "/Users/你的名字/Desktop/supermemory/dist/index.js"],
      "enabled": true
    },
    "filesystem": {
      ...其他已有的配置...
    }
  }
}
```

#### 4. 保存文件

按 `Cmd + S` 保存，然后关闭编辑器。

---

### 第七步：重启 OpenCode

完全退出 OpenCode，然后重新打开。

---

### 第八步：首次使用

第一次使用时，OpenCode 会自动下载 Embedding 模型（约 45MB）。

你可能会看到类似提示：
```
正在下载模型...
Loading model...
```

等待下载完成（通常 1-2 分钟），之后就可以正常使用了！

---

## 💡 使用示例

### 添加记忆

直接对 OpenCode 说：
```
请帮我记住：我喜欢用 TypeScript 和 React 开发项目，这是我的编程偏好
```

### 搜索记忆

```
搜索一下我说过的编程相关的内容
```

### 标记重要记忆

```
把我刚才说的这条记忆标记为重要
```

---

## 🔧 配置各种 AI 工具

SuperMemory 支持所有 MCP 兼容的 AI 工具。选择你使用的工具：

---

### OpenCode

**配置文件位置：** `~/.config/opencode/opencode.json`

```bash
# 打开配置文件
open ~/.config/opencode/opencode.json
```

**添加配置：**
```json
{
  "mcp": {
    "supermemory": {
      "type": "local",
      "command": ["node", "/你的路径/supermemory/dist/index.js"],
      "enabled": true
    }
  }
}
```

---

### Claude Desktop

**配置文件位置：**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```bash
# macOS 打开配置文件
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**添加配置：**
```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/你的路径/supermemory/dist/index.js"]
    }
  }
}
```

---

### Cursor

**配置文件位置：** 项目根目录下的 `.cursor/mcp.json`

```bash
# 在项目目录创建配置
mkdir -p .cursor
touch .cursor/mcp.json
```

**添加配置：**
```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/你的路径/supermemory/dist/index.js"]
    }
  }
}
```

⚠️ **注意**：Cursor 需要在每个项目中单独配置，或者在用户目录配置全局 MCP。

---

### Windsurf

**配置文件位置：** `~/.codeium/windsurf/mcp_config.json`

```bash
# 打开配置文件
open ~/.codeium/windsurf/mcp_config.json
```

**添加配置：**
```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/你的路径/supermemory/dist/index.js"]
    }
  }
}
```

---

### Cline (VS Code 扩展)

1. 打开 VS Code
2. 点击左侧 Cline 图标
3. 点击 ⚙️ 设置 → MCP Servers
4. 点击 "Edit MCP Settings"
5. 添加配置：

```json
{
  "mcpServers": {
    "supermemory": {
      "command": "node",
      "args": ["/你的路径/supermemory/dist/index.js"]
    }
  }
}
```

---

### Continue (VS Code 扩展)

**配置文件位置：** `~/.continue/config.json`

```bash
# 打开配置文件
open ~/.continue/config.json
```

**添加配置：**
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["/你的路径/supermemory/dist/index.js"]
        }
      }
    ]
  }
}
```

---

### Zed

**配置文件位置：** `~/.config/zed/settings.json`

```bash
# 打开配置文件
open ~/.config/zed/settings.json
```

**添加配置：**
```json
{
  "mcp_servers": {
    "supermemory": {
      "command": "node",
      "args": ["/你的路径/supermemory/dist/index.js"]
    }
  }
}
```

---

### Amazon Q Developer

在 VS Code 中：
1. 打开 Amazon Q 扩展设置
2. 找到 MCP Server 配置
3. 添加：

```json
{
  "supermemory": {
    "command": "node",
    "args": ["/你的路径/supermemory/dist/index.js"]
  }
}
```

---

### Goose

**配置文件位置：** `~/.config/goose/config.yaml`

```bash
# 打开配置文件
open ~/.config/goose/config.yaml
```

**添加配置：**
```yaml
mcp_servers:
  supermemory:
    command: node
    args:
      - /你的路径/supermemory/dist/index.js
```

---

### Sage (macOS/iOS)

Sage 使用图形界面配置：
1. 打开 Sage 应用
2. 进入 Settings → MCP Servers
3. 点击 "+" 添加新服务器
4. 填写：
   - Name: `supermemory`
   - Command: `node`
   - Args: `/你的路径/supermemory/dist/index.js`

---

### 通义灵码 (Tongyi Lingma)

在 VS Code 中：
1. 打开通义灵码扩展设置
2. 找到 MCP 配置选项
3. 添加服务器配置

---

## 📝 配置格式总结

| 工具 | 配置键名 | 配置文件位置 |
|------|----------|--------------|
| OpenCode | `"mcp"` | `~/.config/opencode/opencode.json` |
| Claude Desktop | `"mcpServers"` | `~/Library/Application Support/Claude/...` |
| Cursor | `"mcpServers"` | `.cursor/mcp.json` |
| Windsurf | `"mcpServers"` | `~/.codeium/windsurf/mcp_config.json` |
| Cline | `"mcpServers"` | VS Code 设置 |
| Continue | `"experimental.modelContextProtocolServers"` | `~/.continue/config.json` |
| Zed | `"mcp_servers"` | `~/.config/zed/settings.json` |

---

## ⚠️ 重要提示

**所有配置都需要：**

1. 把 `/你的路径/` 替换成你的实际项目路径
2. 路径必须是**绝对路径**（以 `/` 开头）
3. 重启 AI 工具让配置生效

**获取你的路径：**
```bash
# 在 supermemory 项目目录下运行
pwd
```

输出示例：`/Users/shashademac/Desktop/supermemory`

完整配置示例：`/Users/shashademac/Desktop/supermemory/dist/index.js`

---

## 📁 数据存储位置

所有数据都存储在本地：

```
~/.supermemory/
├── memory.db      # 数据库（记忆 + 向量）
└── models/        # Embedding 模型（约 45MB）
```

---

## 🤖 自动化记忆（v2.1 新功能）

**无需手动说"帮我记住"，AI 会自动识别并记录有价值的信息！**

### 自动触发场景

| 场景 | 自动记录内容 | 记忆类型 |
|------|-------------|----------|
| 错误解决 | 错误描述 + 解决方案 | `procedural` |
| 用户表达偏好 | "我喜欢"、"我习惯"... | `habit` |
| 方法功能描述 | "这个方法用于..." | `procedural` |
| API 使用示例 | "使用 xxx API..." | `semantic` |
| 代码文件变更 | 文件结构、功能概述 | `project` |

### 自动记录示例

```
用户: "这个 TypeError 我通过添加 null check 修复了"
     ↓
AI 自动识别: 错误解决模式
     ↓
自动记录: procedural 类型，importance=1
     ↓
内容: "TypeError: ... Fixed by adding null check."
```

### 自动关联发现

```
对话中同时提到: searchSimilar, cosineSimilarity
     ↓
自动创建关系: searchSimilar --related_to--> cosineSimilarity
```

### 自动清理

| 清理条件 | 操作 |
|----------|------|
| 普通记忆超过 30 天未访问 | 自动删除 |
| 质量评分 < 0.3 且非重要 | 自动删除 |
| 已失效记忆 | 保留但标记 |

### 控制自动化

```
# 查看状态
auto action=status

# 启用/禁用
auto action=enable
auto action=disable
```

### 配置选项

在 `.env` 中设置：
```env
# 自动化记忆（默认启用）
AUTO_MEMORY=true
```

---

## 🛠️ 可用工具（v1.1）

### recall - 🔍 自动检索（重要！）

**每次回答用户问题前，AI 会自动调用此工具检索相关记忆！**

| 参数 | 说明 |
|------|------|
| query | 用户的问题或话题 |

**使用示例：**
```
用户: "mybot 项目路径是什么？"
     ↓
AI 调用: recall(query="mybot 项目在哪里")
     ↓
返回: 📚 相关记忆：• mybot 项目路径是 /Users/.../mybot [重要1]
     ↓
AI 回答: mybot 项目路径是 /Users/shashademac/Desktop/mybot
```

### memory - 记忆操作

| action | 功能 | 参数 |
|--------|------|------|
| `add` | 添加记忆 | content, type, importance, project_path |
| `search` | 搜索记忆 | query, limit |
| `get` | 获取记忆 | id |
| `delete` | 删除记忆 | id |
| `list` | 列出记忆 | list_type: project/recent/important/long_term |
| `mark` | 标记重要 | id, level |
| `invalidate` | 使失效 | id, reason |
| `clear` | 清空所有记忆（保留默认设置） | - |

> ⚠️ **默认记忆**：系统会自动保留一条默认记忆，指导 AI 简洁输出。清空记忆时此记忆不会被删除。

### knowledge - 知识图谱

| action | 功能 | 参数 |
|--------|------|------|
| `add` | 添加关系 | subject, predicate, object |
| `query` | 查询关系 | entity, depth |

### optimize - 优化系统

| action | 功能 | 参数 |
|--------|------|------|
| `feedback` | 反馈 | memory_id, type, comment |
| `trigger` | 触发优化 | - |
| `cleanup` | 清理过期记忆 | - |

### auto - 自动化控制

| action | 功能 | 参数 |
|--------|------|------|
| `status` | 查看状态 | - |
| `enable` | 启用自动化 | - |
| `disable` | 禁用自动化 | - |

### backup - 备份操作

| action | 功能 | 参数 |
|--------|------|------|
| `export` | 导出 | - |
| `import` | 导入 | data |

---

### 使用示例

```
# 添加记忆
memory action=add content="我喜欢TypeScript" type=habit importance=1

# 搜索记忆
memory action=search query="编程偏好" limit=5

# 列出最近记忆
memory action=list list_type=recent hours=24

# 添加关系
knowledge action=add subject="search方法" predicate="calls" object="embedding"

# 查询关系
knowledge action=query entity="search方法" depth=1
```

---

## 📝 记忆类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `episodic` | 情景记忆 | "昨天讨论了架构" |
| `semantic` | 语义记忆 | "用户偏好深色主题" |
| `procedural` | 程序记忆 | "部署流程是..." |
| `project` | 项目记忆 | "项目用 Next.js" |
| `session` | 会话记忆 | "讨论性能优化" |
| `habit` | 习惯记忆 | "喜欢 TypeScript" |

---

## ⭐ 重要性等级

| 等级 | 说明 |
|------|------|
| `0` | 普通（可衰减） |
| `1` | 重要（延长保留） |
| `2` | 关键（永久保留） |

---

## 💰 Token 消耗说明

### SuperMemory 本身 = 0 Token

| 操作 | Token 消耗 | 原因 |
|------|-----------|------|
| 本地向量搜索 | 0 | 模型在本地运行 |
| 存储记忆 | 0 | SQLite 本地写入 |
| 向量化 | 0 | 本地模型推理 |

### AI 调用工具时的 Token 消耗

```
用户: "搜索我的编程偏好"
     ↓
AI 思考并决定调用工具      ≈ 50-100 tokens
     ↓
工具执行（本地）            = 0 tokens
     ↓
AI 理解返回结果             ≈ 50-200 tokens
     ↓
AI 生成回复                 ≈ 100-300 tokens
     ↓
总计                        ≈ 200-600 tokens
```

### 各操作的 Token 估算

| 操作 | AI思考 | 理解结果 | 生成回复 | 总计 |
|------|--------|----------|----------|------|
| 添加记忆 | ~50 | ~30 | ~50 | **~130** |
| 搜索记忆 | ~50 | ~100 | ~100 | **~250** |
| 列出记忆 | ~50 | ~150 | ~100 | **~300** |
| 添加关系 | ~50 | ~30 | ~50 | **~130** |
| 查询关系 | ~50 | ~100 | ~100 | **~250** |

### v1.0 vs v2.0 Token 对比

| 项目 | v1.0 | v2.0 | 节省 |
|------|------|------|------|
| 工具定义（AI启动时读取） | ~2000 | ~600 | **70%** |
| 每次操作 | ~300-800 | ~200-600 | **~30%** |
| 返回结果格式 | 完整JSON | 精简文本 | **50%+** |

### 节省 Token 的技巧

1. **批量操作** - 一次添加多条相关记忆
2. **精简查询** - 使用具体的关键词而非泛泛的问题
3. **限制数量** - 设置合理的 `limit` 参数
4. **合理标记** - 重要记忆标记为 `importance=2`，搜索时优先返回

---

## ❓ 常见问题

### 1. 模型下载失败？

检查网络，确保能访问 HuggingFace。国内可能需要代理。

### 2. 配置文件找不到？

**macOS/Linux：** `~/.config/opencode/opencode.json`
**Windows：** `%USERPROFILE%\.config\opencode\opencode.json`

如果文件不存在，可以手动创建一个。

### 3. 如何清理所有数据？

```bash
rm -rf ~/.supermemory/
```

下次运行会重新创建。

### 4. 如何查看已保存的记忆？

```bash
sqlite3 ~/.supermemory/memory.db "SELECT * FROM memories"
```

### 5. 报错 "Cannot find module"？

确保路径正确，用 `pwd` 获取完整路径。

---

## 📦 技术依赖

| 包名 | 用途 |
|------|------|
| `@modelcontextprotocol/sdk` | MCP 协议 |
| `better-sqlite3` | SQLite 数据库 |
| `@xenova/transformers` | 本地向量模型 |

---

## 📄 License

ISC