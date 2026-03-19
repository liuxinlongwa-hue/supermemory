import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { MemoryDatabase } from './db/database.js';
import { MemoryManager } from './memory/manager.js';
import { EmbeddingClient } from './embedding/client.js';
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

const embeddingClient = new EmbeddingClient({
  baseUrl: process.env.EMBEDDING_BASE_URL!,
  apiKey: process.env.EMBEDDING_API_KEY!,
  modelId: process.env.EMBEDDING_MODEL_ID!
});

const searchEngine = new SearchEngine(db, embeddingClient);

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
      },
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
      },
      {
        name: 'get_memory',
        description: '获取指定记忆',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '记忆ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_memory',
        description: '删除记忆',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '记忆ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'get_project_memories',
        description: '获取项目相关记忆',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: { type: 'string', description: '项目路径' }
          },
          required: ['project_path']
        }
      },
      {
        name: 'get_long_term_memories',
        description: '获取长期记忆（重要等级1或2）',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_recent_memories',
        description: '获取最近记忆',
        inputSchema: {
          type: 'object',
          properties: {
            hours: { type: 'number', description: '时间范围（小时，默认24）' }
          }
        }
      },
      {
        name: 'mark_important',
        description: '标记记忆重要性',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '记忆ID' },
            level: { type: 'number', enum: [0, 1, 2], description: '重要性等级' }
          },
          required: ['id', 'level']
        }
      },
      {
        name: 'get_important_memories',
        description: '获取重要记忆',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'add_relation',
        description: '添加实体关系',
        inputSchema: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: '主体实体' },
            predicate: { type: 'string', description: '关系类型' },
            object: { type: 'string', description: '客体实体' }
          },
          required: ['subject', 'predicate', 'object']
        }
      },
      {
        name: 'query_relations',
        description: '查询实体关系',
        inputSchema: {
          type: 'object',
          properties: {
            entity: { type: 'string', description: '实体名称' },
            depth: { type: 'number', description: '查询深度（1或2）' }
          },
          required: ['entity']
        }
      },
      {
        name: 'invalidate_fact',
        description: '使记忆失效',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '记忆ID' },
            reason: { type: 'string', description: '失效原因（可选）' }
          },
          required: ['id']
        }
      },
      {
        name: 'query_timeline',
        description: '按时间范围查询记忆',
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'number', description: '开始时间戳' },
            to: { type: 'number', description: '结束时间戳' }
          },
          required: ['from', 'to']
        }
      },
      {
        name: 'give_feedback',
        description: '对记忆给出反馈',
        inputSchema: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', description: '记忆ID' },
            type: { type: 'string', enum: ['positive', 'negative', 'correction'], description: '反馈类型' },
            comment: { type: 'string', description: '反馈评论（可选）' }
          },
          required: ['memory_id', 'type']
        }
      },
      {
        name: 'trigger_optimization',
        description: '触发质量优化',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'export_memory',
        description: '导出记忆数据',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'import_memory',
        description: '导入记忆数据',
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string', description: 'JSON格式的记忆数据' }
          },
          required: ['data']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'add_memory':
      const addId = memoryManager.addMemory(args as any);
      return {
        content: [{ type: 'text', text: `Memory added successfully. ID: ${addId}` }]
      };

    case 'search_memory':
      const searchResults = await searchEngine.search(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(searchResults, null, 2) }]
      };

    case 'get_memory':
      const memory = memoryManager.getMemory((args as any).id);
      return {
        content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }]
      };

    case 'delete_memory':
      const deleted = memoryManager.deleteMemory((args as any).id);
      return {
        content: [{ type: 'text', text: deleted ? 'Memory deleted successfully' : 'Memory not found' }]
      };

    case 'get_project_memories':
      const projectMemories = memoryManager.getProjectMemories((args as any).project_path);
      return {
        content: [{ type: 'text', text: JSON.stringify(projectMemories, null, 2) }]
      };

    case 'get_long_term_memories':
      const longTermMemories = memoryManager.getLongTermMemories();
      return {
        content: [{ type: 'text', text: JSON.stringify(longTermMemories, null, 2) }]
      };

    case 'get_recent_memories':
      const recentMemories = memoryManager.getRecentMemories((args as any).hours);
      return {
        content: [{ type: 'text', text: JSON.stringify(recentMemories, null, 2) }]
      };

    case 'mark_important':
      const marked = memoryManager.markImportant((args as any).id, (args as any).level);
      return {
        content: [{ type: 'text', text: marked ? 'Importance updated' : 'Memory not found' }]
      };

    case 'get_important_memories':
      const importantMemories = memoryManager.getImportantMemories();
      return {
        content: [{ type: 'text', text: JSON.stringify(importantMemories, null, 2) }]
      };

    case 'add_relation': {
      const { subject, predicate, object: objectEntity } = args as any;
      let subjectEntity = graphManager.getEntityByName(subject);
      if (!subjectEntity) {
        const subjectId = graphManager.addEntity(subject);
        subjectEntity = { id: subjectId };
      }
      let objectEnt = graphManager.getEntityByName(objectEntity);
      if (!objectEnt) {
        const objectId = graphManager.addEntity(objectEntity);
        objectEnt = { id: objectId };
      }
      const relationId = graphManager.addRelation((subjectEntity as any).id, predicate, (objectEnt as any).id);
      return {
        content: [{ type: 'text', text: `Relation added successfully. ID: ${relationId}` }]
      };
    }

    case 'query_relations': {
      const { entity, depth } = args as any;
      const entityRecord = graphManager.getEntityByName(entity);
      if (!entityRecord) {
        return {
          content: [{ type: 'text', text: 'Entity not found' }]
        };
      }
      const relations = graphManager.queryRelations((entityRecord as any).id, depth ?? 1);
      return {
        content: [{ type: 'text', text: JSON.stringify(relations, null, 2) }]
      };
    }

    case 'invalidate_fact':
      const invalidated = memoryManager.invalidateFact((args as any).id, (args as any).reason);
      return {
        content: [{ type: 'text', text: invalidated ? 'Memory invalidated' : 'Memory not found' }]
      };

    case 'query_timeline':
      const timelineMemories = memoryManager.queryTimeline((args as any).from, (args as any).to);
      return {
        content: [{ type: 'text', text: JSON.stringify(timelineMemories, null, 2) }]
      };

    case 'give_feedback':
      const feedbackId = feedbackManager.giveFeedback((args as any).memory_id, (args as any).type, (args as any).comment);
      return {
        content: [{ type: 'text', text: `Feedback recorded. ID: ${feedbackId}` }]
      };

    case 'trigger_optimization':
      const optimizationResult = feedbackManager.triggerOptimization();
      return {
        content: [{ type: 'text', text: `Optimization completed. Processed: ${optimizationResult.processed} memories` }]
      };

    case 'export_memory':
      const exportedData = exportManager.exportMemory();
      return {
        content: [{ type: 'text', text: exportedData }]
      };

    case 'import_memory':
      const importResult = exportManager.importMemory((args as any).data);
      if (importResult.error) {
        return {
          content: [{ type: 'text', text: `Import failed: ${importResult.error}` }]
        };
      }
      return {
        content: [{ type: 'text', text: `Import completed. Imported: ${importResult.imported} memories` }]
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

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

main().catch(console.error);