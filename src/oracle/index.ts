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
    name: "oracle-server",
    version: "0.6.4",
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
  { id: 5, text: "Automatic Workload Repository (AWR) with optional sql_id, requires SELECT_CATALOG_ROLE and grant execute on DBMS_WORKLOAD_REPOSITORY package" }
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
    const result = await connection.execute<{ METADATA: string }>(
      `select dbms_developer.get_metadata (name => UPPER(:tableName)) as metadata from dual`, [tableName], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(result.rows?.[0]?.METADATA, null, 2),
        },
      ],
      isError: false,
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
      {
        name: "stats",
        description: "Stats for SQL object",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
      {
        name: "connect",
        description: "Switch to a new Oracle DB connection on the fly",
        inputSchema: {
          type: "object",
          properties: {
            connectionString: { type: "string" },
            user: { type: "string" },
            password: { type: "string" },
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!pool) {
    throw new Error("Oracle connection pool not initialized.");
  }

  if (request.params.name === "query") {
    const sql = typeof request.params.arguments?.sql === "string" 
      ? request.params.arguments.sql.replace(/;\s*$/, "") 
      : "";

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
    const sql = typeof request.params.arguments?.sql === "string" 
      ? request.params.arguments.sql.replace(/;\s*$/, "") 
      : "";

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
  if (request.params.name === "stats") {
    const tableName = request.params.arguments?.name as string;
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute<{ STATS_JSON: string }>(`SELECT JSON_OBJECT(
  'table_stats' VALUE (
    SELECT JSON_OBJECT(
      'owner' VALUE owner,
      'table_name' VALUE table_name,
      'num_rows' VALUE num_rows,
      'blocks' VALUE blocks,
      'empty_blocks' VALUE empty_blocks,
      'avg_row_len' VALUE avg_row_len,
      'last_analyzed' VALUE TO_CHAR(last_analyzed, 'YYYY-MM-DD HH24:MI:SS')
    )
    FROM dba_tab_statistics
    WHERE owner = UPPER(USER) AND table_name = UPPER(:tableName)
  ),
  'index_stats' VALUE (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'index_name' VALUE index_name,
        'blevel' VALUE blevel,
        'leaf_blocks' VALUE leaf_blocks,
        'distinct_keys' VALUE distinct_keys,
        'num_rows' VALUE num_rows,
        'clustering_factor' VALUE clustering_factor,
        'last_analyzed' VALUE TO_CHAR(last_analyzed, 'YYYY-MM-DD HH24:MI:SS')
      )
    )
    FROM dba_ind_statistics
    WHERE table_owner = UPPER(USER) AND table_name = UPPER(:tableName)
  ),
  'column_stats' VALUE (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'column_name' VALUE column_name,
        'num_distinct' VALUE num_distinct,
        'density' VALUE density,
        'histogram' VALUE histogram,
        'last_analyzed' VALUE TO_CHAR(last_analyzed, 'YYYY-MM-DD HH24:MI:SS')
      )
    )
    FROM dba_tab_col_statistics
    WHERE owner = UPPER(USER) AND table_name = UPPER(:tableName)
  )
) AS stats_json
FROM dual`, [tableName,tableName,tableName], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return {
        content: [{ type: "text", text: result.rows?.[0]?.STATS_JSON }],
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
  if (request.params.name === "connect") {
    const newConnectionString = request.params.arguments?.connectionString;
    const newUser = request.params.arguments?.user;
    const newPassword = request.params.arguments?.password;
    if (
      typeof newConnectionString !== "string" || !newConnectionString ||
      typeof newUser !== "string" || !newUser ||
      typeof newPassword !== "string" || !newPassword
    ) {
      return {
        content: [{ type: "text", text: "Missing or invalid connectionString, user, or password argument." }],
        isError: true,
      };
    }
    try {
      if (pool) {
        try {
          await pool.close(0); // Close existing pool immediately
        } catch (err) {
          // Log but continue
          console.warn("Error closing previous pool:", err);
        }
      }
      // Override env vars for this session
      process.env.ORACLE_USER = newUser;
      process.env.ORACLE_PASSWORD = newPassword;
      await initializePool(newConnectionString);
      return {
        content: [{ type: "text", text: `Successfully connected to new Oracle DB: ${newConnectionString} as user ${newUser}` }],
        isError: false,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to connect: ${err}` }],
        isError: true,
      };
    }
  }
  if (request.params.name === "awr") {
    let connection;
    try {
      connection = await pool.getConnection();
      // Step 1: Get dbid
      const dbidResult = await connection.execute<{ DBID: number }>(
        `SELECT dbid FROM v$database`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const dbid = dbidResult.rows?.[0]?.DBID;
      if (!dbid) {
        return {
          content: [{ type: "text", text: "Could not retrieve DBID from v$database." }],
          isError: true,
        };
      }
      // Step 2: Get begin_snap_id and end_snap_id
      const snapResult = await connection.execute<{
        BEGIN_SNAP_ID: number;
        END_SNAP_ID: number;
      }>(
        `WITH multi_instance_snaps AS (
          SELECT snap_id
          FROM dba_hist_snapshot
          GROUP BY snap_id
          HAVING COUNT(*) > 1
        ),
        recent_snaps AS (
          SELECT snap_id
          FROM multi_instance_snaps
          ORDER BY snap_id DESC
          FETCH FIRST 2 ROWS ONLY
        )
        SELECT
          MIN(s1.snap_id) AS begin_snap_id,
          MAX(s2.snap_id) AS end_snap_id,
          s1.startup_time
        FROM
          dba_hist_snapshot s1
        JOIN
          dba_hist_snapshot s2
            ON s1.startup_time = s2.startup_time
           AND s1.snap_id < s2.snap_id
        WHERE
          s1.snap_id IN (SELECT snap_id FROM recent_snaps)
          AND s2.snap_id IN (SELECT snap_id FROM recent_snaps)
          AND s1.begin_interval_time >= SYSDATE - 1
          AND s2.begin_interval_time >= SYSDATE - 1
        GROUP BY s1.startup_time
        ORDER BY end_snap_id DESC
        FETCH FIRST 1 ROW ONLY`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const begin_snap_id = snapResult.rows?.[0]?.BEGIN_SNAP_ID;
      const end_snap_id = snapResult.rows?.[0]?.END_SNAP_ID;
      if (!begin_snap_id || !end_snap_id) {
        return {
          content: [{ type: "text", text: "Could not retrieve snapshot IDs." }],
          isError: true,
        };
      }
      // Step 3: Generate AWR report
      const sql_id = request.params.arguments?.sql_id;
      let awrResult;
      if (!sql_id) {
        awrResult = await connection.execute(
          `SELECT output FROM TABLE(dbms_workload_repository.awr_report_text(:dbid, 1, :begin_snap_id, :end_snap_id))`,
          [dbid, begin_snap_id, end_snap_id],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
      } else {
        awrResult = await connection.execute(
          `SELECT output FROM TABLE(dbms_workload_repository.awr_sql_report_text(:dbid, 1, :begin_snap_id, :end_snap_id, :sql_id))`,
          [dbid, begin_snap_id, end_snap_id, sql_id],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
      }
      // The report is a multi-row text output, concatenate all rows
      const reportText = awrResult.rows?.map((r: any) => r.OUTPUT).join("\n") ?? "No report output.";
      return {
        content: [{ type: "text", text: reportText }],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error generating AWR report: ${error?.message ?? error}` }],
        isError: true,
      };
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

server.setRequestHandler(PromptsListRequestSchema, async () => {
  return {
    prompts,
  };
});

async function runServer() {
  await initializePool(connectionString); // Initialize the pool before starting the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);

process.stdin.on("close", () => {
  console.error("Oracle MCP Server closed");
  server.close();
  process.exit(0);
});
