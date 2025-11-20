import pg from "pg";

let pool: pg.Pool | undefined = undefined;

let resourceBaseUrl: URL | undefined = undefined;

export async function initializePool(connectionString: string) {
    pool = new pg.Pool({
        connectionString,
    });
    // Test connection
    const client = await pool.connect();
    client.release();

    const url = new URL(connectionString);
    url.protocol = "postgres:";
    url.password = "";
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
