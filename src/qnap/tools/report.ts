import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { getNasHost, getNasSid, fetchWithTimeout } from "./connect.js";

export async function reportHandler(request: CallToolRequest) {
    const nas_host = getNasHost();
    const nas_sid = getNasSid();

    if (!nas_host || !nas_sid) {
        return {
            content: [{ type: "text", text: "Not connected to QNAP NAS. Use qnap-connect first." }],
            isError: true
        };
    }

    try {
        // Fetch system info to get model details
        const dc = Date.now();
        const url = `${nas_host}/cgi-bin/sys/sysRequest.cgi?subfunc=sys_info&sid=${nas_sid}&_dc=${dc}`;
        const response = await fetchWithTimeout(url);
        const text = await response.text();

        const modelMatch = text.match(/<displayModelName><!\[CDATA\[([^\]]*)\]\]><\/displayModelName>/);
        const modelName = modelMatch ? modelMatch[1] : "Unknown QNAP Model";

        // Extract IP from host
        const hostUrl = new URL(nas_host);

        const report = [
            `### QNAP Connection Report`,
            `- **Model Name**: ${modelName}`,
            `- **IP Address**: ${hostUrl.hostname}`,
            `- **Connected User**: ${process.env.QNAP_USER || "admin"}`,
            `- **Access URL**: ${nas_host}`
        ].join('\n');

        return {
            content: [{ type: "text", text: report }],
            isError: false,
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error generating report: ${error.message}` }],
            isError: true
        };
    }
}
