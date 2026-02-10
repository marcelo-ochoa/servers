import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { getNasHost, getNasSid, fetchWithTimeout } from "./connect.js";

export async function dirHandler(request: CallToolRequest) {
    const { path } = request.params.arguments || {};
    const nas_host = getNasHost();
    const nas_sid = getNasSid();

    if (!nas_host || !nas_sid) {
        return {
            content: [{ type: "text", text: "Not connected to QNAP NAS. Use qnap-connect first." }],
            isError: true
        };
    }

    if (typeof path !== "string" || !path) {
        return {
            content: [{ type: "text", text: "Missing or invalid path argument." }],
            isError: true,
        };
    }

    try {
        const url = `${nas_host}/cgi-bin/filemanager/utilRequest.cgi?func=get_list&path=${path}&sid=${nas_sid}&limit=100&start=0`;
        const response = await fetchWithTimeout(url);
        const data = await response.json();

        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            isError: false,
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error listing directory: ${error.message}` }],
            isError: true
        };
    }
}
