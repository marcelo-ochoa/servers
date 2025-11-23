import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { initializePool } from "./db.js";
import { listResourcesHandler, readResourceHandler, callToolHandler } from "./handlers.js";
import { tools } from "./tools.js";

const server = new Server(
    {
        name: "postgres-server",
        version: "0.6.3",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    },
);

server.setRequestHandler(ListResourcesRequestSchema, listResourcesHandler);
server.setRequestHandler(ReadResourceRequestSchema, readResourceHandler);
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, callToolHandler);

export async function runServer() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide a database URL as a command-line argument");
        process.exit(1);
    }

    const databaseUrl = args[0];
    try {
        await initializePool(databaseUrl);
    } catch (error) {
        console.error("Failed to initialize database pool:", error);
        process.exit(1);
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
}
