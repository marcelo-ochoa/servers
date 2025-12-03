## Change Log

### 2025-12-03
- **feat**: Add prompts capability and list handler to MySQL server
  - Updated version to 1.0.1
  - Added `prompts: {}` capability to server configuration
  - Implemented `PromptsListRequestSchema` using zod for request validation
  - Added prompts array with 5 MySQL-specific prompt templates:
    - `mysql-query` - Example query execution
    - `mysql-explain` - Query execution plan analysis
    - `mysql-stats` - Table statistics retrieval
    - `mysql-connect` - Database connection instructions
    - `mysql-awr` - Performance report generation
  - Added request handler for `prompts/list` endpoint
  - Published package @marcelo-ochoa/server-mysql@1.0.1 to npm registry

### 2025-12-01
- **feat**: Bump server version to 1.0.0
  - Updated version to 1.0.0 across package.json, server.json, and server.ts
  - Added AWR_example.md with performance report examples for GLPI database
  - Added CHANGELOG.md for better change tracking
  - Enhanced mysql-awr tool with improved reporting capabilities
  - Updated README with MySQL AWR in action section

### 2025-11-27
- **chore**: Bump patch version in server.json
  - Minor version update for server configuration

- **feat**: Add `ListResourceTemplates` handler to MySQL server and enhance connection string parsing
  - Enhanced server capabilities with resource template listing
  - Improved connection string parsing in db.ts to support connection options
  - Updated package dependencies

- **docs**: Update README to document recent server.json definitions, version bumps, URL simplification, and graceful shutdown
  - Comprehensive documentation updates

- **feat**: Add server.json definitions and update versions for MySQL server
  - Added server.json with MCP server metadata and schema
  - Updated version to 0.1.2
  - Added mcpName field to package.json
  - Configured environment variables (MYSQL_USER, MYSQL_PASSWORD) in server definition

### 2025-11-26
- **docs**: Update README to include recent server version bumps, URL simplification, and graceful shutdown
  - Updated documentation with latest changes and improvements

- **chore**: Bump MySQL server version to 0.1.1
  - Updated package versions to reflect recent improvements
  - Synchronized package-lock.json with new versions

- **feat**: Simplify database resource URLs and add graceful server shutdown on stdin close
  - Simplified resource URL format from `mysql://database/table/schema` to cleaner format
  - Added graceful shutdown handling for improved stability
  - Enhanced db.ts with better connection management

### Recent Updates

- **2025-11-27** (0085cb7)
  - feat: Add server.json definitions and update versions for MySQL and PostgreSQL servers
  - Added server.json with MCP server metadata and schema
  - Updated version to 0.1.2
  - Added mcpName field to package.json
  - Configured environment variables (MYSQL_USER, MYSQL_PASSWORD) in server definition

- **2025-11-26** (6dade3b)
  - docs: Update READMEs to include recent server version bumps, URL simplification, and graceful shutdown

- **2025-11-26** (ca32105)
  - chore: Bump MySQL and PostgreSQL server versions to 0.1.1 and 0.6.4

- **2025-11-26** (d065d11)
  - feat: Simplify database resource URLs and add graceful server shutdown on stdin close

- **2025-11-25** (ca2c3fb)
  - feat: Add new MySQL service with AWR, query, explain, and stats tools, along with updated CI/CD workflow and dependencies
