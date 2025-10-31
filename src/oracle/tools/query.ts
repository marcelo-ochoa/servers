import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { withConnection } from "../db.js";
import oracledb from "oracledb";

export const queryHandler = async (request: CallToolRequest) => {
    const sql = typeof request.params.arguments?.sql === "string"
        ? request.params.arguments.sql.replace(/;\s*$/, "")
        : "";

    return await withConnection(async (connection) => {
        await connection.execute("SET TRANSACTION READ ONLY");
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return {
            content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
            isError: false,
        };
    });
};
