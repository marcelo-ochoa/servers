import { MikroTikApi } from "./tools/api.js";

let api: MikroTikApi | null = null;
let connectionConfig: any = null;

export function setApi(newApi: MikroTikApi | null, config: any) {
    if (api) {
        api.close();
    }
    api = newApi;
    connectionConfig = config;
}

export function getApi(): MikroTikApi | null {
    return api;
}

export async function initializeApi(host: string, user?: string, password?: string, secure: boolean = false) {
    const dbUser = user || process.env.MK_USER;
    const dbPassword = password || process.env.MK_PASSWORD;

    if (!dbUser || !dbPassword) {
        throw new Error("Environment variables MK_USER and MK_PASSWORD must be set.");
    }

    const newApi = new MikroTikApi({ debug: false });
    try {
        await newApi.connect(host, undefined, secure);
        const loggedIn = await newApi.login(dbUser, dbPassword);
        if (!loggedIn) {
            newApi.close();
            throw new Error("Login failed: invalid username or password");
        }
        setApi(newApi, { host, user: dbUser, secure });
    } catch (error: any) {
        newApi.close();
        throw error;
    }
}

export const callToolHandler = async (request: any) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case "mk-connect": {
            const { host, user, password, secure = false } = args;
            const newApi = new MikroTikApi({ debug: false });
            try {
                await newApi.connect(host, undefined, secure);
                const loggedIn = await newApi.login(user, password);
                if (!loggedIn) {
                    newApi.close();
                    return {
                        content: [{ type: "text", text: "Login failed: invalid username or password" }],
                        isError: true,
                    };
                }
                setApi(newApi, { host, user, secure });
                return {
                    content: [{ type: "text", text: `Connected successfully to ${host}` }],
                };
            } catch (error: any) {
                newApi.close();
                return {
                    content: [{ type: "text", text: `Connection error: ${error.message}` }],
                    isError: true,
                };
            }
        }

        case "mk-report": {
            return await handleReport();
        }

        case "mk-print": {
            let { sentence } = args;
            if (!sentence.startsWith('/')) {
                sentence = '/' + sentence;
            }
            if (sentence.endsWith('/print')) {
                sentence = sentence.slice(0, -6);
            }
            return await handleGenericPrint(sentence + '/print');
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
};

async function handleGenericPrint(command: string) {
    const currentApi = getApi();
    if (!currentApi) {
        return {
            content: [{ type: "text", text: "Not connected. Call mk-connect tool first." }],
            isError: true,
        };
    }
    try {
        const replies = await currentApi.talk([command]);
        const results = replies
            .filter((r) => r.command === "!re")
            .map((r) => r.attributes);
        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error executing command: ${error.message}` }],
            isError: true,
        };
    }
}

async function handleReport() {
    const currentApi = getApi();
    if (!currentApi) {
        return {
            content: [{ type: "text", text: "Not connected. Call mk-connect tool first." }],
            isError: true,
        };
    }

    try {
        const report: any = {};

        // 1. System Resources
        const resReplies = await currentApi.talk(["/system/resource/print"]);
        report.resources = resReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};

        // 2. Routerboard Info
        const rbReplies = await currentApi.talk(["/system/routerboard/print"]);
        report.routerboard = rbReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};

        // 3. System Health (might fail on some boards)
        try {
            const healthReplies = await currentApi.talk(["/system/health/print"]);
            report.health = healthReplies.filter(r => r.command === "!re").map(r => r.attributes);
        } catch (e) {
            report.health = "Not available or error: " + (e as Error).message;
        }

        // 4. Interfaces and Traffic
        const intReplies = await currentApi.talk(["/interface/print"]);
        const interfaces = intReplies.filter(r => r.command === "!re").map(r => r.attributes);
        report.interfaces = interfaces;

        const runningInterfaces = interfaces.filter(i => i.running === "true" && i.disabled === "false").map(i => i.name);

        if (runningInterfaces.length > 0) {
            report.traffic = {};
            for (const name of runningInterfaces) {
                try {
                    const trafficReplies = await currentApi.talk(["/interface/monitor-traffic", `=interface=${name}`, "=once="]);
                    report.traffic[name] = trafficReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};
                } catch (e) {
                    report.traffic[name] = "Error: " + (e as Error).message;
                }
            }
        }

        // 5. CPU Profile (brief snapshot if possible)
        try {
            const profileReplies = await currentApi.talk(["/tool/profile", "=once="]);
            report.cpuProfile = profileReplies.filter(r => r.command === "!re").map(r => r.attributes);
        } catch (e) {
            report.cpuProfile = "Not available or error: " + (e as Error).message;
        }

        return {
            content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error generating report: ${error.message}` }],
            isError: true,
        };
    }
}

