import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { MemoryDatabase } from './db/database.js';
import { MemoryManager } from './memory/manager.js';
import { EmbeddingClient } from './embedding/client.js';
import { SearchEngine } from './memory/search.js';

dotenv.config();

const db = new MemoryDatabase(process.env.MEMORY_DB_PATH);
const memoryManager = new MemoryManager(db);

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
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'add_memory':
      const memoryId = memoryManager.addMemory(args as any);
      return {
        content: [{ 
          type: 'text', 
          text: `Memory added successfully. ID: ${memoryId}` 
        }]
      };
    case 'search_memory':
      const results = await searchEngine.search(args as any);
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(results, null, 2)
        }]
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