#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import oracledb from "oracledb";

const server = new Server(
  {
    name: "example-servers/oracle",
    version: "0.1.0",
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
  { id: 1, text: "query select * from tabs" },
  { id: 2, text: "explain select * from tabs" }
];

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
const resourceBaseUrl = new URL("oracle://" + process.env.ORACLE_USER.toUpperCase());
resourceBaseUrl.protocol = "oracle:";
resourceBaseUrl.password = "";

const SCHEMA_PATH = "schema";

// Initialize the pool outside of request handlers.
let pool: oracledb.Pool | undefined = undefined;

// Helper function to initialize the connection pool
async function initializePool(connectionString: string) {
  const dbUser = process.env.ORACLE_USER;
  const dbPassword = process.env.ORACLE_PASSWORD;

  if (!dbUser || !dbPassword) {
    console.error(
      "Error: Environment variables ORACLE_USER and ORACLE_PASSWORD must be set.",
    );
    process.exit(1);
  }

  try {
    //console.log("Initializing OracleDB connection pool...");
    pool = await oracledb.createPool({
      user: dbUser,
      password: dbPassword,
      connectionString,
      poolMin: 4,
      poolMax: 10,
      poolIncrement: 1,
      queueTimeout: 60000,
    });
    //console.log("OracleDB connection pool initialized successfully.");
  } catch (err) {
    console.error("connectionString:", connectionString);
    console.error("Error initializing connection pool:", err);
    process.exit(1);
  }
}


server.setRequestHandler(ListResourcesRequestSchema, async () => {
  if (!pool) {
    throw new Error("Oracle connection pool not initialized.");
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute<{ TABLE_NAME: string }>(
      `SELECT table_name as "TABLE_NAME" FROM user_tables`,
      [], // binding parameters
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return {
      resources: result.rows!.map((row) => ({
        uri: new URL(`${row.TABLE_NAME}/${SCHEMA_PATH}`, resourceBaseUrl).href,
        mimeType: "application/json",
        name: `"${row.TABLE_NAME}" database schema`,
      })),
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing Oracle connection:", err);
      }
    }
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (!pool) {
    throw new Error("Oracle connection pool not initialized.");
  }

  const resourceUrl = new URL(request.params.uri);

  const pathComponents = resourceUrl.pathname.split("/");
  const schema = pathComponents.pop();
  const tableName = pathComponents.pop();

  if (schema !== SCHEMA_PATH) {
    throw new Error("Invalid resource URI");
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute<{ COLUMN_NAME: string, DATA_TYPE: string }>(
      `SELECT column_name as "COLUMN_NAME", data_type as "DATA_TYPE" FROM user_tab_columns WHERE table_name = UPPER(:tableName)`,
      { tableName },
    );

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing Oracle connection:", err);
      }
    }
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Run a read-only SQL query",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
          },
        },
      },
      {
        name: "explain",
        description: "Explain Plan for SQL query",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!pool) {
    throw new Error("Oracle connection pool not initialized.");
  }

  if (request.params.name === "query") {
    const sql = request.params.arguments?.sql as string;

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute("SET TRANSACTION READ ONLY");
      const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return {
        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
        isError: false,
      };
    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.warn("Could not close connection:", err);
        }
      }
    }
  }
  if (request.params.name === "explain") {
    const sql = request.params.arguments?.sql as string;

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute("EXPLAIN PLAN FOR " + sql);
      const result = await connection.execute("SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, NULL, 'ALL'))", [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return {
        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
        isError: false,
      };
    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.warn("Could not close connection:", err);
        }
      }
    }
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

import { z } from "zod";

const PromptsListRequestSchema = z.object({
  method: z.literal("prompts/list"),
  params: z.object({}),
});

let inactivityTimer: NodeJS.Timeout | null = null;
const INACTIVITY_TIMEOUT = 60000; // 1 minute

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    // console.log("No activity detected for 30 seconds. Shutting down server...");
    process.exit(0);
  }, INACTIVITY_TIMEOUT);
}

server.setRequestHandler(PromptsListRequestSchema, async () => {
  resetInactivityTimer();
  return {
    prompts,
  };
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down server...");
  process.exit(0);
});

async function runServer() {
  await initializePool(connectionString); // Initialize the pool before starting the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  resetInactivityTimer(); // Start the inactivity timer when the server starts
}

runServer().catch(console.error);
