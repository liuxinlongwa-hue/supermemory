# SuperMemory MCP Server

本地 MCP 记忆服务，为 AI Agent 提供跨会话的长期记忆能力。

## ✨ 特性

- ✅ **纯本地运行** - 无需任何 API Key
- ✅ **17 个 MCP 工具** - 完整的记忆管理工具集
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

## 🛠️ 可用工具列表

| 工具 | 功能 |
|------|------|
| `add_memory` | 添加新记忆 |
| `search_memory` | 语义搜索记忆 |
| `get_memory` | 获取指定记忆 |
| `delete_memory` | 删除记忆 |
| `get_project_memories` | 获取项目记忆 |
| `get_long_term_memories` | 获取长期记忆 |
| `get_recent_memories` | 获取最近记忆 |
| `mark_important` | 标记重要性 |
| `get_important_memories` | 获取重要记忆 |
| `add_relation` | 添加实体关系 |
| `query_relations` | 查询关系图谱 |
| `invalidate_fact` | 使记忆失效 |
| `query_timeline` | 时间范围查询 |
| `give_feedback` | 对记忆反馈 |
| `trigger_optimization` | 触发优化 |
| `export_memory` | 导出记忆 |
| `import_memory` | 导入记忆 |

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