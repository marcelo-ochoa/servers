export const tools = [
    {
        name: "mk-connect",
        description: "Connect to the MikroTik router",
        inputSchema: {
            type: "object",
            properties: {
                host: { type: "string", description: "Router IP address" },
                user: { type: "string", description: "Username" },
                password: { type: "string", description: "Password" },
                secure: { type: "boolean", description: "Use secure connection (TLS/SSL)", default: false },
            },
            required: ["host", "user", "password"],
        },
    },
    {
        name: "mk-report",
        description: "Generates a comprehensive system report including resource usage, health, and interface traffic statistics.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "mk-print",
        description: "Returns a JSON array with the result of a MikroTik API /print command. For exampe /ip/routes stand for /ip/route/print",
        inputSchema: {
            type: "object",
            properties: {
                sentence: {
                    type: "string",
                    description: "The API path (e.g., /ip/route, /interface). '/print' will be automatically appended."
                },
            },
            required: ["sentence"],
        },
    },
];
