import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { initializePool } from "./db.js";
import { listResourcesHandler, readResourceHandler, callToolHandler } from "./handlers.js";
import { tools } from "./tools.js";

const server = new Server(
  {
    name: "oracle-server",
    version: "1.0.5",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {}, // Add this line to indicate support for prompts
    },
  },
);

const prompts = [
  { name: "orcl-query: Execute Query", description: "orcl-query select * from COUNTRIES" },
  { name: "orcl-explain: Explain Query", description: "orcl-explain select * from COUNTRIES" },
  { name: "orcl-stats: Table Statistics", description: "orcl-stats COUNTRIES" },
  { name: "orcl-connect: Database Connection", description: "orcl-connect to Oracle using an string like host.docker.internal:1521/freepdb1 user name and password" },
  { name: "orcl-awr: Performance Report", description: "orcl-awr with optional sql_id, requires SELECT_CATALOG_ROLE and grant execute on DBMS_WORKLOAD_REPOSITORY package" }
];

const PromptsListRequestSchema = z.object({
  method: z.literal("prompts/list"),
  params: z.object({}),
});

server.setRequestHandler(PromptsListRequestSchema, async () => {
  return {
    prompts,
  };
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates: [
      {
        uriTemplate: "oracle://{user}/{table_name}/schema",
        name: "Table Schema",
        description: "Schema information for an Oracle database table including column names and data types",
      },
    ],
  };
});

server.setRequestHandler(ListResourcesRequestSchema, listResourcesHandler);
server.setRequestHandler(ReadResourceRequestSchema, readResourceHandler);
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, callToolHandler);

export async function runServer() {
  const args = process.argv.slice(2);
  const connectionString = args[0];

  if (connectionString) {
    if (!process.env.ORACLE_USER) {
      console.error("Error: Environment variable ORACLE_USER must be set.");
      process.exit(1);
    }
    await initializePool(connectionString); // Initialize the pool before starting the server
  } else {
    console.error("Warning: No Oracle connection string provided. Use orcl-connect tool before using other functionality.");
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stdin.on("close", () => {
    console.error("Oracle MCP Server closed");
    server.close();
    process.exit(0);
  });
}
