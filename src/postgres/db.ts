import pg from "pg";

let pool: pg.Pool | undefined = undefined;

let resourceBaseUrl: URL | undefined = undefined;

export async function initializePool(connectionString: string) {
    const dbUser = process.env.PG_USER;
    const dbPassword = process.env.PG_PASSWORD;

    if (!dbUser || !dbPassword) {
        console.error(
            "Error: Environment variables PG_USER and PG_PASSWORD must be set.",
        );
        process.exit(1);
    }

    // Parse the connection string to extract host, port, and database
    // Expected format: postgresql://host:port/dbname or host:port/dbname
    let host: string;
    let port: number;
    let database: string;

    try {
        // Try parsing as URL first
        if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
            const url = new URL(connectionString);
            host = url.hostname;
            port = url.port ? parseInt(url.port) : 5432;
            database = url.pathname.slice(1); // Remove leading '/'
        } else {
            // Parse format: host:port/dbname
            const match = connectionString.match(/^([^:]+):(\d+)\/(.+)$/);
            if (!match) {
                throw new Error("Invalid connection string format. Expected: host:port/dbname or postgresql://host:port/dbname");
            }
            host = match[1];
            port = parseInt(match[2]);
            database = match[3];
        }
    } catch (err) {
        console.error("Error parsing connection string:", err);
        process.exit(1);
    }

    pool = new pg.Pool({
        user: dbUser,
        password: dbPassword,
        host,
        port,
        database,
    });

    // Test connection
    const client = await pool.connect();
    client.release();

    // Build resource base URL without credentials
    const url = new URL(`postgresql://${database}`);
    resourceBaseUrl = url;
}

export function getPool(): pg.Pool {
    if (!pool) {
        throw new Error("Postgres connection pool not initialized.");
    }
    return pool;
}

export function getResourceBaseUrl(): URL {
    if (!resourceBaseUrl) {
        throw new Error("Resource Base URL not initialized.");
    }
    return resourceBaseUrl;
}

export async function withConnection<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
        return await callback(client);
    } finally {
        client.release();
    }
}

export async function closePool() {
    if (pool) {
        await pool.end();
        pool = undefined;
    }
}
