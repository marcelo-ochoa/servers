import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { connectHandler, initializeApi } from "./tools/connect.js";
import { reportHandler } from "./tools/report.js";
import { dirHandler } from "./tools/dir.js";
import { fileInfoHandler } from "./tools/file_info.js";

const toolHandlers: Record<string, (request: CallToolRequest) => Promise<any>> = {
    "qnap-connect": connectHandler,
    "qnap-report": reportHandler,
    "qnap-dir": dirHandler,
    "qnap-file-info": fileInfoHandler,
};

export const callToolHandler = async (request: CallToolRequest) => {
    const handler = toolHandlers[request.params.name];
    if (handler) {
        return handler(request);
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
};

export { initializeApi };

