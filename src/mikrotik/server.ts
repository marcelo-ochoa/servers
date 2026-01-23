import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { callToolHandler, listResourcesHandler, readResourceHandler, initializeApi } from "./handlers.js";
import { tools } from "./tools.js";

const server = new Server(
    {
        name: "mikrotik-api",
        version: "1.0.4",
    },
    {
        capabilities: {
            tools: {},
            prompts: {},
            resources: {},
        },
    }
);

const prompts = [
    { name: "mk-connect: Connect to MikroTik", description: "connect to MikroTik using host, user and password" },
    { name: "mk-report: System Report", description: "show a comprehensive system report" },
    { name: "mk-get-route: Routing Table", description: "print ip/route to show the routing table" },
    { name: "mk-get-interface: List Interfaces", description: "print interface to list all interfaces" },
    { name: "mk-get-log: View Logs", description: "print log to view system logs" },
    { name: "mk-awr: Security Audit", description: "audit router's security and performance" }
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

let lock: Promise<any> = Promise.resolve();

async function executeSequential<T>(fn: () => Promise<T>): Promise<T> {
    const result = (async () => {
        try {
            await lock;
        } catch (e) {
            // Ignore errors from previous commands to let the next one run
        }
        return fn();
    })();
    lock = result.catch(() => { });
    return result;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return executeSequential(() => callToolHandler(request));
});

server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    return executeSequential(() => listResourcesHandler(request));
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return executeSequential(() => readResourceHandler(request));
});

export async function runServer() {
    const args = process.argv.slice(2);
    const host = args[0];
    const secure = args[1] === "true";

    if (host) {
        try {
            await initializeApi(host, undefined, undefined, secure);
        } catch (error) {
            console.error("Failed to connect to MikroTik:", error);
            // Don't exit here, allow the server to start even if connection fails
        }
    } else {
        console.error("Warning: No MikroTik host provided. Use mk-connect tool before using other functionality.");
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);

    process.stdin.on("close", () => {
        console.error("Mikrotik MCP Server closed");
        server.close();
        process.exit(0);
    });
}
