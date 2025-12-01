import { CallToolRequest, ListResourcesRequest, ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { withConnection } from "./db.js";
import { queryHandler } from "./tools/query.js";
import { explainHandler } from "./tools/explain.js";
import { statsHandler } from "./tools/stats.js";
import { connectHandler } from "./tools/connect.js";
import { awrHandler } from "./tools/awr.js";
import oracledb from "oracledb";

const toolHandlers: Record<string, (request: CallToolRequest) => Promise<any>> = {
    "orcl-query": queryHandler,
    "orcl-explain": explainHandler,
    "orcl-stats": statsHandler,
    "orcl-connect": connectHandler,
    "orcl-awr": awrHandler,
};

export const callToolHandler = async (request: CallToolRequest) => {
    const handler = toolHandlers[request.params.name];
    if (handler) {
        return handler(request);
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
};

const SCHEMA_PATH = "schema";

export const listResourcesHandler = async (request: ListResourcesRequest) => {
    if (!process.env.ORACLE_USER) {
        throw new Error("ORACLE_USER environment variable is not set");
    }
    const resourceBaseUrl = new URL("oracle://" + process.env.ORACLE_USER.toUpperCase());
    resourceBaseUrl.protocol = "oracle:";
    resourceBaseUrl.password = "";

    return await withConnection(async (connection) => {
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
    });
};


export const readResourceHandler = async (request: ReadResourceRequest) => {
    const resourceUrl = new URL(request.params.uri);

    const pathComponents = resourceUrl.pathname.split("/");
    const schema = pathComponents.pop();
    const tableName = pathComponents.pop();

    if (schema !== SCHEMA_PATH) {
        throw new Error("Invalid resource URI");
    }

    return await withConnection(async (connection) => {
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
    });
};
