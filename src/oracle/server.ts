import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
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
    version: "0.7.3",
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
  { id: 1, text: "query select * from COUNTRIES" },
  { id: 2, text: "explain select * from COUNTRIES" },
  { id: 3, text: "stats COUNTRIES" },
  { id: 4, text: "connect to Oracle using an string like host.docker.internal:1521/freepdb1 user name and password" },
  { id: 5, text: "awr with optional sql_id, requires SELECT_CATALOG_ROLE and grant execute on DBMS_WORKLOAD_REPOSITORY package" }
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

server.setRequestHandler(ListResourcesRequestSchema, listResourcesHandler);
server.setRequestHandler(ReadResourceRequestSchema, readResourceHandler);
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, callToolHandler);

export async function runServer() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide an Oracle database connection string as a command-line argument");
    process.exit(1);
  }

  const connectionString = args[0];

  if (!process.env.ORACLE_USER) {
    console.error("Error: Environment variable ORACLE_USER must be set.");
    process.exit(1);
  }

  await initializePool(connectionString); // Initialize the pool before starting the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stdin.on("close", () => {
    console.error("Oracle MCP Server closed");
    server.close();
    process.exit(0);
  });
}
