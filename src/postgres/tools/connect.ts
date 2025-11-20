import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { initializePool, closePool } from "../db.js";

export const connectHandler = async (request: CallToolRequest) => {
    const connectionString = request.params.arguments?.connectionString;

    if (typeof connectionString !== "string" || !connectionString) {
        return {
            content: [{ type: "text", text: "Missing or invalid connectionString argument." }],
            isError: true,
        };
    }

    try {
        await closePool();
        await initializePool(connectionString);
        return {
            content: [{ type: "text", text: `Successfully connected to Postgres DB: ${connectionString}` }],
            isError: false,
        };
    } catch (err) {
        return {
            content: [{ type: "text", text: `Failed to connect: ${err}` }],
            isError: true,
        };
    }
};
