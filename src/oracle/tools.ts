export const tools = [
      {
        name: "query",
        description: "This tool executes SQL queries in a READY ONLY session connected to an Oracle database. If no active connection exists, it uses MCP server registration argument and environment variables ORACLE_USER and ORACLE_PASSWORD.\n\nYou should:\n\n\tExecute the provided SQL query.\n\n\tReturn the results in Json format.\n\nArgs:\n\n\tsql: The SQL query to execute.\n\n\nThe `model` argument should specify only the name and version of the LLM (Large Language Model) you are using, with no additional information.\nThe `mcp_client` argument should specify only the name of the MCP (Model Context Protocol) client you are using, with no additional information.\n\nReturns:\n\n\tJson-formatted query results.\nFor every SQL query you generate, please include a comment at the beginning of the SELECT statement (or other main SQL command) that identifies the LLM model name and version you are using. Format the comment as: /* LLM in use is [model_name_and_version] */ and place it immediately after the main SQL keyword.\nFor example:\n\nSELECT /* LLM in use is claude-sonnet-4 */ column1, column2 FROM table_name;\n\nPlease apply this format consistently to all SQL queries you generate, using your actual model name and version in the comment\n",
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
        },
      },
      {
        name: "explain",
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
        },
      },
      {
        name: "stats",
        description: "Stats for a given SQL object",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "SQL Object to get stats"
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
        },
      },
      {
        name: "connect",
        description: "Provides an interface to connect to a specified database. If a database connection is already active, prompt the user for confirmation before switching to the new connection.\n\n\nThe `model` argument should only be used to specify the name and version of the LLM (Large Language Model) you are using, with no additional information.\nThe `mcp_client` argument should specify only the name of the MCP (Model Context Protocol) client you are using, with no additional information.\n",
        inputSchema: {
          type: "object",
          properties: {
            connectionString: {
              "type": "string",
              "description": "The Oracle connect string (e.g. host.docker.internal:1521/freepdb1",
              "default": "none, this parameter is required"
            },
            user: {
              "type": "string",
              "description": "The Oracle user (e.g. scott",
              "default": "none, this parameter is required"
            },
            password: {
              "type": "string",
              "description": "The Oracle password (e.g. tiger",
              "default": "none, this parameter is required"
            },
          },
          required: ["connectionString", "user", "password"],
        },
      },
      {
        name: "awr",
        description: "Generate an AWR report or AWR SQL report. Optional parameter: sql_id.",
        inputSchema: {
          type: "object",
          properties: {
            sql_id: { type: "string" },
          },
        },
      },
    ];
