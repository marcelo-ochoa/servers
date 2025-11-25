import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined = undefined;

let resourceBaseUrl: URL | undefined = undefined;

export async function initializePool(connectionString: string) {
    const dbUser = process.env.MYSQL_USER;
    const dbPassword = process.env.MYSQL_PASSWORD;

    if (!dbUser || !dbPassword) {
        console.error(
            "Error: Environment variables MYSQL_USER and MYSQL_PASSWORD must be set.",
        );
        process.exit(1);
    }

    // Parse the connection string to extract host, port, and database
    // Expected format: mysql://host:port/dbname or host:port/dbname
    let host: string;
    let port: number;
    let database: string;

    try {
        // Try parsing as URL first
        if (connectionString.startsWith('mysql://')) {
            const url = new URL(connectionString);
            host = url.hostname;
            port = url.port ? parseInt(url.port) : 3306;
            database = url.pathname.slice(1); // Remove leading '/'
        } else {
            // Parse format: host:port/dbname
            const match = connectionString.match(/^([^:]+):(\d+)\/(.+)$/);
            if (!match) {
                throw new Error("Invalid connection string format. Expected: host:port/dbname or mysql://host:port/dbname");
            }
            host = match[1];
            port = parseInt(match[2]);
            database = match[3];
        }
    } catch (err) {
        console.error("Error parsing connection string:", err);
        process.exit(1);
    }

    pool = mysql.createPool({
        user: dbUser,
        password: dbPassword,
        host,
        port,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    // Test connection
    const connection = await pool.getConnection();
    connection.release();

    // Build resource base URL without credentials
    const url = new URL(`mysql://${host}:${port}/${database}`);
    resourceBaseUrl = url;
}

export function getPool(): mysql.Pool {
    if (!pool) {
        throw new Error("MySQL connection pool not initialized.");
    }
    return pool;
}

export function getResourceBaseUrl(): URL {
    if (!resourceBaseUrl) {
        throw new Error("Resource Base URL not initialized.");
    }
    return resourceBaseUrl;
}

export async function withConnection<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        connection.release();
    }
}

export async function closePool() {
    if (pool) {
        await pool.end();
        pool = undefined;
    }
}
