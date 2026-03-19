import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { MemoryDatabase } from './db/database.js';
import { MemoryManager } from './memory/manager.js';
import { SearchEngine } from './memory/search.js';
import { GraphManager } from './graph/manager.js';
import { FeedbackManager } from './feedback/manager.js';
import { ExportManager } from './export/manager.js';

dotenv.config();

const db = new MemoryDatabase(process.env.MEMORY_DB_PATH);
const memoryManager = new MemoryManager(db);
const graphManager = new GraphManager(db);
const feedbackManager = new FeedbackManager(db);
const exportManager = new ExportManager(db);

const searchEngine = new SearchEngine(db);

const server = new Server(
  { name: 'supermemory', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'memory',
      description: '记忆操作：add(添加) | search(搜索) | get(获取) | delete(删除) | list(列表) | mark(标记重要) | invalidate(失效)',
      inputSchema: {
        type: 'object',
        properties: {
          action: { 
            type: 'string', 
            enum: ['add', 'search', 'get', 'delete', 'list', 'mark', 'invalidate'],
            description: '操作类型'
          },
          content: { type: 'string', description: '记忆内容(add)' },
          type: { 
            type: 'string', 
            enum: ['episodic', 'semantic', 'procedural', 'project', 'session', 'habit'],
            description: '记忆类型(add)'
          },
          importance: { type: 'number', enum: [0, 1, 2], description: '重要性(add/mark)' },
          query: { type: 'string', description: '搜索词(search)' },
          id: { type: 'string', description: '记忆ID(get/delete/mark/invalidate)' },
          level: { type: 'number', enum: [0, 1, 2], description: '重要性等级(mark)' },
          list_type: { 
            type: 'string', 
            enum: ['project', 'recent', 'important', 'long_term'],
            description: '列表类型(list)'
          },
          project_path: { type: 'string', description: '项目路径(add/list)' },
          hours: { type: 'number', description: '时间范围小时数(list recent)' },
          reason: { type: 'string', description: '失效原因(invalidate)' },
          limit: { type: 'number', description: '返回数量(search/list)' }
        },
        required: ['action']
      }
    },
    {
      name: 'knowledge',
      description: '知识图谱：add(添加关系) | query(查询关系)',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'query'], description: '操作类型' },
          subject: { type: 'string', description: '主体(add)' },
          predicate: { type: 'string', description: '关系(add)' },
          object: { type: 'string', description: '客体(add)' },
          entity: { type: 'string', description: '查询实体(query)' },
          depth: { type: 'number', description: '查询深度1-2(query)' }
        },
        required: ['action']
      }
    },
    {
      name: 'optimize',
      description: '优化系统：feedback(反馈) | trigger(触发优化)',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['feedback', 'trigger'], description: '操作类型' },
          memory_id: { type: 'string', description: '记忆ID(feedback)' },
          type: { type: 'string', enum: ['positive', 'negative', 'correction'], description: '反馈类型(feedback)' },
          comment: { type: 'string', description: '评论(feedback)' }
        },
        required: ['action']
      }
    },
    {
      name: 'backup',
      description: '备份操作：export(导出) | import(导入)',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['export', 'import'], description: '操作类型' },
          data: { type: 'string', description: 'JSON数据(import)' }
        },
        required: ['action']
      }
    }
  ]
}));

function formatMemories(memories: any[]): string {
  if (!memories || memories.length === 0) return '[]';
  return memories.map(m => ({
    id: m.id?.slice(0, 8),
    content: m.content?.length > 100 ? m.content.slice(0, 100) + '...' : m.content,
    type: m.type,
    imp: m.importance
  })).map(m => `[${m.id}] ${m.content} (${m.type}, imp:${m.imp})`).join('\n');
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = args as any;

  switch (name) {
    case 'memory': {
      switch (a.action) {
        case 'add': {
          const id = memoryManager.addMemory({
            content: a.content,
            type: a.type,
            importance: a.importance,
            project_path: a.project_path
          });
          await searchEngine.indexMemory(id, a.content);
          return { content: [{ type: 'text', text: `✓ 已添加 [${id.slice(0,8)}]` }] };
        }
        case 'search': {
          const results = await searchEngine.search({ query: a.query, limit: a.limit || 5 });
          return { content: [{ type: 'text', text: formatMemories(results) || '未找到' }] };
        }
        case 'get': {
          const m = memoryManager.getMemory(a.id);
          if (!m) return { content: [{ type: 'text', text: '未找到' }] };
          return { content: [{ type: 'text', text: JSON.stringify(m, null, 2) }] };
        }
        case 'delete': {
          const ok = memoryManager.deleteMemory(a.id);
          return { content: [{ type: 'text', text: ok ? '✓ 已删除' : '未找到' }] };
        }
        case 'list': {
          let memories;
          switch (a.list_type) {
            case 'project': memories = memoryManager.getProjectMemories(a.project_path); break;
            case 'recent': memories = memoryManager.getRecentMemories(a.hours || 24); break;
            case 'important': memories = memoryManager.getImportantMemories(); break;
            case 'long_term': memories = memoryManager.getLongTermMemories(); break;
            default: memories = memoryManager.getAllMemories();
          }
          const limited = memories.slice(0, a.limit || 10);
          return { content: [{ type: 'text', text: formatMemories(limited) }] };
        }
        case 'mark': {
          const ok = memoryManager.markImportant(a.id, a.level);
          return { content: [{ type: 'text', text: ok ? `✓ 已标记为 ${a.level}` : '未找到' }] };
        }
        case 'invalidate': {
          const ok = memoryManager.invalidateFact(a.id, a.reason);
          return { content: [{ type: 'text', text: ok ? '✓ 已失效' : '未找到' }] };
        }
        default:
          return { content: [{ type: 'text', text: '未知操作' }] };
      }
    }

    case 'knowledge': {
      switch (a.action) {
        case 'add': {
          let s = graphManager.getEntityByName(a.subject);
          if (!s) s = { id: graphManager.addEntity(a.subject) };
          let o = graphManager.getEntityByName(a.object);
          if (!o) o = { id: graphManager.addEntity(a.object) };
          const id = graphManager.addRelation((s as any).id, a.predicate, (o as any).id);
          return { content: [{ type: 'text', text: `✓ 已添加关系 [${id.slice(0,8)}]` }] };
        }
        case 'query': {
          const e = graphManager.getEntityByName(a.entity);
          if (!e) return { content: [{ type: 'text', text: '实体未找到' }] };
          const relations = graphManager.queryRelations((e as any).id, a.depth || 1);
          const formatted = relations.map((r: any) => 
            `${r.subject_name} --${r.predicate}--> ${r.object_name}`
          ).join('\n') || '无关系';
          return { content: [{ type: 'text', text: formatted }] };
        }
        default:
          return { content: [{ type: 'text', text: '未知操作' }] };
      }
    }

    case 'optimize': {
      switch (a.action) {
        case 'feedback': {
          const id = feedbackManager.giveFeedback(a.memory_id, a.type, a.comment);
          return { content: [{ type: 'text', text: `✓ 已记录反馈` }] };
        }
        case 'trigger': {
          const result = feedbackManager.triggerOptimization();
          return { content: [{ type: 'text', text: `✓ 已优化 ${result.processed} 条记忆` }] };
        }
        default:
          return { content: [{ type: 'text', text: '未知操作' }] };
      }
    }

    case 'backup': {
      switch (a.action) {
        case 'export': {
          const data = exportManager.exportMemory();
          return { content: [{ type: 'text', text: data }] };
        }
        case 'import': {
          const result = exportManager.importMemory(a.data);
          if (result.error) return { content: [{ type: 'text', text: `✗ ${result.error}` }] };
          return { content: [{ type: 'text', text: `✓ 已导入 ${result.imported} 条` }] };
        }
        default:
          return { content: [{ type: 'text', text: '未知操作' }] };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SuperMemory MCP Server v2.0 running');
}

process.on('SIGINT', () => { db.close(); process.exit(0); });

main().catch(console.error);