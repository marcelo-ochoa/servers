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
        name: "mysql-server",
        version: "1.0.3",
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
    { id: 1, text: "mysql-query select * from test_users" },
    { id: 2, text: "mysql-explain select * from test_users" },
    { id: 3, text: "mysql-stats test_users" },
    { id: 4, text: "mysql-connect to MySQL using a string like host.docker.internal:3306/dbname user name and password" },
    { id: 5, text: "mysql-awr for MySQL performance report similar to Oracle AWR" }
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
                uriTemplate: "mysql://{database}/{table_name}/schema",
                name: "Table Schema",
                description: "Schema information for a MySQL database table including column names and data types",
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

    process.stdin.on("close", () => {
        console.error("MySQL MCP Server closed");
        server.close();
        process.exit(0);
    });
}
