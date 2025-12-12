# Oracle Database

A Model Context Protocol server that provides read-only access to Oracle Database. This server enables LLMs to inspect database schemas, execute and explain read-only queries.

## Components

### Tools

- **orcl-query**
  - Execute read-only SQL queries against the connected Oracle Database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

- **orcl-explain**
  - Explain plan SQL queries against the connected Oracle Database
  - Input: `sql` (string): The SQL query to execute
  - Requires GRANT SELECT_CATALOG_ROLE TO your_user;

- **orcl-stats**
  - Get statistics for a given table on current connected schema
  - Input: `name` (string): The table name
  - Table owner is equal to USER SQL function returning value

- **orcl-connect**
  - Reconnect using new credentials
  - Input: `connectionString` (string): SQLNet connect string for example host.docker.internal:1521/freepdb1
  - Input: `user` (string): Username for example scott
  - Input: `password` (string): Password, for example tiger

- **orcl-awr**
  - Automatic Workload Repository (AWR) with optional sql_id, requires SELECT_CATALOG_ROLE and grant execute on DBMS_WORKLOAD_REPOSITORY package
  - Input: `sql_id` (string): (optional) SQL id to get the AWR report for an specific query, if null full last generated AWR report

### Resources

The server provides schema information for each table in the Oracle Database current connected user:

- **Table Schemas** (`oracle://USER/<table>/schema`)
  - JSON schema information for each table
  - Includes column names and data types
  - Automatically discovered from Oracle Database metadata

## Change Log

See [Change Log](https://github.com/marcelo-ochoa/servers/blob/main/src/oracle/CHANGELOG.md) for the history of changes.

## Demos

See [Demos](https://github.com/marcelo-ochoa/servers/blob/main/src/oracle/Demos.md) for usage examples with Claude Desktop, Docker AI, Gemini CLI, and Antigravity Code Editor.


## Oracle AWR in action

See [Oracle AWR in action](https://github.com/marcelo-ochoa/servers/blob/main/src/oracle/AWR_example.md) for an example of an AWR report generated using the `orcl-awr` tool, followed by an analysis of the top SQL statements.


## Building

Docker:

```sh
docker build -t mochoa/mcp-oracle -f src/oracle/Dockerfile .
```

## Sources

As usual the code of this extension is at [GitHub](https://github.com/marcelo-ochoa/servers), feel free to suggest changes and make contributions, note that I am a beginner developer of React and TypeScript so contributions to make this UI better are welcome.

## License

This MCP server is licensed under the [MIT License](LICENSE). This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

## Compared to SQLcl MCP server

Using SQLcl Docker extension you could register a connection using:

```sh
docker exec --user sqlcl -ti mochoa_sqlcl-docker-extension-desktop-extension-service /opt/sqlcl/bin/sql -save hr_mcp -savepwd hr/hr_2025@host.docker.internal:1521/freepdb1   
```

after that using this registration:

```yml
{
  "mcpServers": {
    "sqlcl-mcp-server": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "exec",
        "--user",
        "sqlcl",
        "-i",
        "mochoa_sqlcl-docker-extension-desktop-extension-service",
        "/opt/sqlcl/bin/sql",
        "-mcp"
      ]
    }
  }
}
```

Just replace above Demo prompts instead of "orcl-query" tool use "run-sql".
