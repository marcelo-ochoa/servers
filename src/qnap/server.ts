import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { tools } from "./tools.js";
import { callToolHandler, initializeApi } from "./handlers.js";

const prompts = [
    { name: "qnap-connect: Connect to QNAP NAS", description: "connect to QNAP NAS using host, username and password" },
    { name: "qnap-report: System Report", description: "show a comprehensive system report with CPU, memory, and disk status" },
    { name: "qnap-dir: List Directory", description: "list contents of a directory on the QNAP NAS" },
    { name: "qnap-file-info: File Information", description: "get detailed information about a specific file" }
];

const PromptsListRequestSchema = z.object({
    method: z.literal("prompts/list"),
    params: z.object({}),
});

export class QnapServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "qnap-mcp-server",
                version: "1.0.1",
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                },
            }
        );

        this.setupHandlers();

        this.server.onerror = (error) => console.error("[MCP Error]", error);
    }

    private setupHandlers() {
        this.server.setRequestHandler(PromptsListRequestSchema, async () => {
            return {
                prompts,
            };
        });

        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: tools,
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            return await callToolHandler(request);
        });
    }

    async run() {
        const args = process.argv.slice(2);
        const host = args[0];

        if (host) {
            try {
                await initializeApi(host);
                console.error(`Automatically connected to QNAP NAS at ${host}`);
            } catch (error: any) {
                console.error(`Failed to automatically connect to QNAP NAS: ${error.message}`);
            }
        } else {
            console.error("Warning: No QNAP host provided as argument. Use qnap-connect tool before using other functionality.");
        }

        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("QNAP MCP server running on stdio");

        process.stdin.on("close", () => {
            console.error("QNAP MCP Server closed");
            this.server.close();
            process.exit(0);
        });
    }
}
