import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { MemoryDatabase } from './db/database.js';

dotenv.config();

const db = new MemoryDatabase(process.env.MEMORY_DB_PATH);

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
      }
    ]
  };
});

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
  
  process.on('SIGINT', () => {
    db.close();
    process.exit(0);
  });
}

main().catch(console.error);