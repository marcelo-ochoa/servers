import { CallToolRequest, ListResourcesRequest, ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { withConnection, getResourceBaseUrl } from "./db.js";
import { queryHandler } from "./tools/query.js";
import { statsHandler } from "./tools/stats.js";
import { connectHandler } from "./tools/connect.js";
import { explainHandler } from "./tools/explain.js";
import { awrHandler } from "./tools/awr.js";

const toolHandlers: Record<string, (request: CallToolRequest) => Promise<any>> = {
    "mysql-query": queryHandler,
    "mysql-stats": statsHandler,
    "mysql-explain": explainHandler,
    "mysql-connect": connectHandler,
    "mysql-awr": awrHandler,
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
    const resourceBaseUrl = getResourceBaseUrl();
    return await withConnection(async (connection) => {
        const [result] = await connection.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
        );
        return {
            resources: (result as any[]).map((row: any) => ({
                uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
                mimeType: "application/json",
                name: `"${row.table_name}" database schema`,
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
        const [columns] = await connection.query(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_TYPE, EXTRA, COLUMN_COMMENT 
             FROM information_schema.COLUMNS 
             WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
            [tableName]
        );

        const [indexes] = await connection.query(
            `SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, COLLATION, CARDINALITY, INDEX_TYPE, COMMENT
             FROM information_schema.STATISTICS
             WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
            [tableName]
        );

        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "application/json",
                    text: JSON.stringify({ columns, indexes }, null, 2),
                },
            ],
        };
    });
};
