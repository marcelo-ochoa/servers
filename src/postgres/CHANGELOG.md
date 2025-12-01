## Change Log

### 2025-11-27
- **feat**: Add server.json definitions and update versions for MySQL and PostgreSQL servers
  - Added server.json with MCP server metadata and schema
  - Updated version to 0.6.5
  - Added mcpName field to package.json
  - Configured environment variables (POSTGRES_USER, POSTGRES_PASSWORD) in server definition

### 2025-11-26
- **docs**: Update READMEs to include recent server version bumps, URL simplification, and graceful shutdown
  - Updated documentation with latest changes and improvements

- **chore**: Bump MySQL and PostgreSQL server versions to 0.1.1 and 0.6.4
  - Updated package versions to reflect recent improvements
  - Synchronized package-lock.json with new versions

- **feat**: Simplify database resource URLs and add graceful server shutdown on stdin close
  - Simplified resource URL format for better usability
  - Added graceful shutdown handling for improved stability

### 2025-11-25
- **docs**: Add change logs to Oracle and Postgres READMEs
  - Detailed new features such as secure Postgres authentication
  - Documented Toon format encoding integration
  - Added Antigravity Code Editor integration instructions

### 2025-11-22
- **feat**: Implement secure PostgreSQL authentication via environment variables and update tool descriptions
  - Added `PG_USER` and `PG_PASSWORD` environment variables for secure credential management
  - Updated `pg-connect` tool to accept explicit user/password arguments
  - Enhanced tool descriptions for better clarity and documentation

### 2025-11-20
- **feat**: Add initial Postgres server implementation, integrate ModelContextProtocol SDK, and update Oracle tools
  - Complete refactoring of PostgreSQL MCP server
  - Modularized code structure with separate tool handlers
  - Implemented `pg-stats`, `pg-connect`, `pg-explain`, and `pg-awr` tools
  - Renamed query tool to `pg-query` to avoid naming collisions
  - Added Docker image build support for postgres service
