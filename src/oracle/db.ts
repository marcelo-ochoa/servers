import oracledb from "oracledb";

let pool: oracledb.Pool | undefined = undefined;

export async function initializePool(connectionString: string) {
  const dbUser = process.env.ORACLE_USER;
  const dbPassword = process.env.ORACLE_PASSWORD;

  if (!dbUser || !dbPassword) {
    console.error(
      "Error: Environment variables ORACLE_USER and ORACLE_PASSWORD must be set.",
    );
    process.exit(1);
  }

  try {
    pool = await oracledb.createPool({
      user: dbUser,
      password: dbPassword,
      connectionString,
      poolMin: 4,
      poolMax: 10,
      poolIncrement: 1,
      queueTimeout: 60000,
    });
  } catch (err) {
    console.error("connectionString:", connectionString);
    console.error("Error initializing connection pool:", err);
    process.exit(1);
  }
}

export function getPool(): oracledb.Pool {
    if (!pool) {
        throw new Error("Oracle connection pool not initialized.");
    }
    return pool;
}

export async function withConnection<T>(callback: (connection: oracledb.Connection) => Promise<T>): Promise<T> {
    const pool = getPool();
    let connection: oracledb.Connection | undefined;
    try {
        connection = await pool.getConnection();
        return await callback(connection);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing Oracle connection:", err);
            }
        }
    }
}

export function getPoolStatus(): string {
  if (!pool) {
    return "Pool not initialized";
  }
  return `Pool created with ${pool.poolMin} min, ${pool.poolMax} max connections. Connections open: ${pool.connectionsOpen}, in use: ${pool.connectionsInUse}.`;
}

export async function closePool() {
  if (pool) {
    try {
      await pool.close(0);
      pool = undefined;
    } catch (err) {
      console.error("Error closing pool:", err);
    }
  }
}
