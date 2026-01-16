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

        case "mk-get": {
            let { sentence } = args;
            if (!sentence.startsWith('/')) {
                sentence = '/' + sentence;
            }
            if (sentence.endsWith('/print')) {
                sentence = sentence.slice(0, -6);
            }
            return await handleGenericPrint(sentence + '/print');
        }

        case "mk-awr": {
            return await handleAwr();
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

async function handleAwr() {
    const currentApi = getApi();
    if (!currentApi) {
        return {
            content: [{ type: "text", text: "Not connected. Call mk-connect tool first." }],
            isError: true,
        };
    }

    try {
        const report: any = {
            timestamp: new Date().toISOString(),
            system: {},
            resources: {},
            network: {},
            security: {},
            recommendations: [],
        };

        // 1. Identity & Resources
        const idReplies = await currentApi.talk(["/system/identity/print"]);
        report.system.identity = idReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};

        const resReplies = await currentApi.talk(["/system/resource/print"]);
        report.resources = resReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};

        const rbReplies = await currentApi.talk(["/system/routerboard/print"]);
        report.system.routerboard = rbReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};

        // 2. Services Audit
        const svcReplies = await currentApi.talk(["/ip/service/print"]);
        const services = svcReplies.filter(r => r.command === "!re").map(r => r.attributes);
        report.security.services = services;

        // 3. DNS Audit
        const dnsReplies = await currentApi.talk(["/ip/dns/print"]);
        const dns = dnsReplies.filter(r => r.command === "!re").map(r => r.attributes)[0] || {};
        report.security.dns = dns;

        // 4. Neighbors (Potential Leak)
        const nbReplies = await currentApi.talk(["/ip/neighbor/print"]);
        report.security.neighbors = nbReplies.filter(r => r.command === "!re").map(r => r.attributes);

        // 5. Interface Summary
        const intReplies = await currentApi.talk(["/interface/print"]);
        const interfaces = intReplies.filter(r => r.command === "!re").map(r => r.attributes);
        report.network.interfaces = interfaces.map(i => ({
            name: i.name,
            type: i.type,
            actual_mtu: i["actual-mtu"],
            running: i.running,
            disabled: i.disabled
        }));

        // 6. Log Audit (Looking for scans/suspicious activity)
        const logReplies = await currentApi.talk(["/log/print"]);
        const logs = logReplies.filter(r => r.command === "!re").map(r => r.attributes);
        const suspiciousPatterns = [
            { key: 'failedLogins', pattern: 'login failed' },
            { key: 'insecureLogins', pattern: 'via telnet' },
            { key: 'ftpLogins', pattern: 'via ftp' },
            { key: 'connectionProbes', pattern: 'tcp connection established from' }
        ];

        const suspiciousSummary: any = {
            failedLogins: { count: 0, lastSeen: null, examples: [] },
            insecureLogins: { count: 0, lastSeen: null, examples: [] },
            ftpLogins: { count: 0, lastSeen: null, examples: [] },
            connectionProbes: { count: 0, lastSeen: null, examples: [] }
        };

        suspiciousPatterns.forEach(p => {
            const matches = logs.filter(l => l.message.toLowerCase().includes(p.pattern));
            if (matches.length > 0) {
                suspiciousSummary[p.key] = {
                    count: matches.length,
                    lastSeen: matches[matches.length - 1].time,
                    examples: matches.slice(-3).map(m => m.message)
                };
            }
        });
        report.security.suspiciousActivity = suspiciousSummary;

        // 7. Generate Recommendations
        const recommendations: string[] = [];

        // CPU & Memory
        if (parseInt(report.resources.cpu_load) > 80) {
            recommendations.push("High CPU load detected (>80%). Check processes and firewall rules.");
        }
        const freeMem = parseInt(report.resources["free-memory"]) || 0;
        const totalMem = parseInt(report.resources["total-memory"]) || 1;
        if (freeMem / totalMem < 0.1) {
            recommendations.push("Low free memory available (<10%). Possible leak or over-subscription.");
        }

        // Security - Insecure Services
        const insecureServices = services.filter(s =>
            s.disabled === "false" && ["telnet", "ftp", "www"].includes(s.name)
        );
        if (insecureServices.length > 0) {
            recommendations.push(`Insecure services enabled: ${insecureServices.map(s => s.name).join(", ")}. Consider disabling them or switching to encrypted alternatives (SSH, SSL).`);
        }

        // Security - DNS Open Resolver
        if (dns["allow-remote-requests"] === "true") {
            recommendations.push("DNS 'allow-remote-requests' is enabled. Ensure you have firewall rules to prevent being used as an open resolver from WAN.");
        }

        // Security - Neighbors
        if (report.security.neighbors.length > 0) {
            recommendations.push("Neighbors discovery is active and found devices. Ensure neighbor discovery is disabled on public-facing (WAN) interfaces.");
        }

        // Security - Log Analysis
        if (suspiciousSummary.failedLogins.count > 0) {
            recommendations.push(`Detected ${suspiciousSummary.failedLogins.count} failed login attempts. Check for brute-force attacks and implement 'fail2ban' style firewall rules.`);
        }
        if (suspiciousSummary.insecureLogins.count > 0 || suspiciousSummary.ftpLogins.count > 0) {
            recommendations.push("Logins via insecure protocols (Telnet/FTP) detected in logs. Disable these services immediately to prevent credential sniffing.");
        }
        if (suspiciousSummary.connectionProbes.count > 0) {
            recommendations.push(`Connection probes detected (${suspiciousSummary.connectionProbes.count}). Review firewall input chain and consider blacklisting scan IPs.`);
        }

        report.recommendations = recommendations;

        return {
            content: [{
                type: "text",
                text: JSON.stringify(report, null, 2),
            }],
        };

    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error generating AWR report: ${error.message}` }],
            isError: true,
        };
    }
}

