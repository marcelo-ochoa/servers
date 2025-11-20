export const tools = [
    {
        name: "pg-query",
        description: "Run a read-only SQL query",
        inputSchema: {
            type: "object",
            properties: {
                sql: {
                    type: "string",
                    description: "The SQL query to execute"
                },
                mcp_client: {
                    "type": "string",
                    "description": "Specify the name and version of the MCP client implementation being used (e.g. Copilot, Claude, Cline...)",
                    "default": "UNKNOWN-MCP-CLIENT"
                },
                model: {
                    "type": "string",
                    "description": "The name (and version) of the language model being used by the MCP client to process requests (e.g. gpt-4.1, claude-sonnet-4, llama4...)",
                    "default": "UNKNOWN-LLM"
                }
            },
            required: ["sql", "mcp_client", "model"]
        },
    },
    {
        name: "pg-stats",
        description: "Get statistics for a specific table",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "The name of the table to get statistics for"
                },
                mcp_client: {
                    "type": "string",
                    "description": "Specify the name and version of the MCP client implementation being used (e.g. Copilot, Claude, Cline...)",
                    "default": "UNKNOWN-MCP-CLIENT"
                },
                model: {
                    "type": "string",
                    "description": "The name (and version) of the language model being used by the MCP client to process requests (e.g. gpt-4.1, claude-sonnet-4, llama4...)",
                    "default": "UNKNOWN-LLM"
                }
            },
            required: ["name"]
        },
    },
    {
        name: "pg-explain",
        description: "Explain Plan for a given SQL query",
        inputSchema: {
            type: "object",
            properties: {
                sql: {
                    type: "string",
                    description: "The SQL query to explain"
                },
                mcp_client: {
                    "type": "string",
                    "description": "Specify the name and version of the MCP client implementation being used (e.g. Copilot, Claude, Cline...)",
                    "default": "UNKNOWN-MCP-CLIENT"
                },
                model: {
                    "type": "string",
                    "description": "The name (and version) of the language model being used by the MCP client to process requests (e.g. gpt-4.1, claude-sonnet-4, llama4...)",
                    "default": "UNKNOWN-LLM"
                }
            },
            required: ["sql", "mcp_client", "model"]
        },
    },
    {
        name: "pg-connect",
        description: "Connect to a PostgreSQL database",
        inputSchema: {
            type: "object",
            properties: {
                connectionString: {
                    type: "string",
                    description: "The PostgreSQL connection string (e.g. postgresql://user:password@host:port/dbname)"
                },
                mcp_client: {
                    "type": "string",
                    "description": "Specify the name and version of the MCP client implementation being used (e.g. Copilot, Claude, Cline...)",
                    "default": "UNKNOWN-MCP-CLIENT"
                },
                model: {
                    "type": "string",
                    "description": "The name (and version) of the language model being used by the MCP client to process requests (e.g. gpt-4.1, claude-sonnet-4, llama4...)",
                    "default": "UNKNOWN-LLM"
                }
            },
            required: ["connectionString"]
        },
    },
    {
        name: "pg-awr",
        description: "Generate a PostgreSQL performance report similar to Oracle AWR. Includes database statistics, top queries (requires pg_stat_statements extension), table/index statistics, connection info, and optimization recommendations.",
        inputSchema: {
            type: "object",
            properties: {
                mcp_client: {
                    "type": "string",
                    "description": "Specify the name and version of the MCP client implementation being used (e.g. Copilot, Claude, Cline...)",
                    "default": "UNKNOWN-MCP-CLIENT"
                },
                model: {
                    "type": "string",
                    "description": "The name (and version) of the language model being used by the MCP client to process requests (e.g. gpt-4.1, claude-sonnet-4, llama4...)",
                    "default": "UNKNOWN-LLM"
                }
            },
        },
    },
];
