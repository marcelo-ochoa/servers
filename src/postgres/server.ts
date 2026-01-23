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
        name: "postgres-server",
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
    { name: "pg-query: Execute Query", description: "pg-query select * from test" },
    { name: "pg-explain: Explain Query", description: "pg-explain select * from test" },
    { name: "pg-stats: Table Statistics", description: "pg-stats test" },
    { name: "pg-connect: Database Connection", description: "pg-connect to PostgreSQL using a connection string like host.docker.internal:5432/dbname with user name and password" },
    { name: "pg-awr: Performance Report", description: "pg-awr to generate a PostgreSQL performance report (requires pg_stat_statements extension)" }
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
                uriTemplate: "postgres://{schema}/{table_name}/schema",
                name: "Table Schema",
                description: "Schema information for a PostgreSQL database table including column names and data types",
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
    const databaseUrl = args[0];

    if (databaseUrl) {
        try {
            await initializePool(databaseUrl);
        } catch (error) {
            console.error("Failed to initialize database pool:", error);
            process.exit(1);
        }
    } else {
        console.error("Warning: No database URL provided. Use pg-connect tool before using other functionality.");
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);

    process.stdin.on("close", () => {
        console.error("Postgres MCP Server closed");
        server.close();
        process.exit(0);
    });
}
