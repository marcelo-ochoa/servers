import { CallToolRequest, ListResourcesRequest, ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { withConnection, getResourceBaseUrl } from "./db.js";
import { queryHandler } from "./tools/query.js";
import { statsHandler } from "./tools/stats.js";
import { connectHandler } from "./tools/connect.js";
import { explainHandler } from "./tools/explain.js";
import { awrHandler } from "./tools/awr.js";

const toolHandlers: Record<string, (request: CallToolRequest) => Promise<any>> = {
    "pg-query": queryHandler,
    "pg-stats": statsHandler,
    "pg-explain": explainHandler,
    "pg-connect": connectHandler,
    "pg-awr": awrHandler,
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
    return await withConnection(async (client) => {
        const result = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        );
        return {
            resources: result.rows.map((row: any) => ({
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

    return await withConnection(async (client) => {
        const result = await client.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
            [tableName],
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
    });
};
