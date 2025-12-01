## Change Log

### 2025-12-01
- **feat**: Bump server version to 1.0.0
  - Updated version to 1.0.0 across package.json, server.json, and server.ts
  - Added AWR_example.md with comprehensive AWR report analysis
  - Added CHANGELOG.md for better change tracking
  - Renamed tools to use `orcl-` prefix for consistency (orcl-query, orcl-explain, orcl-stats, orcl-connect, orcl-awr)
  - Updated handlers and server prompts to reflect new tool names
  - Enhanced README with Oracle AWR in action section

### 2025-11-27
- **chore**: Bump patch version in server.json
  - Minor version update for server configuration

- **feat**: Add `ListResourceTemplates` handler to Oracle server
  - Enhanced server capabilities with resource template listing
  - Updated package dependencies

- **feat**: Add `server.json` to define Oracle MCP server, environment variables, and update related configurations
  - Added server.json with MCP server metadata and schema
  - Updated version to 0.7.5
  - Added mcpName field to package.json
  - Configured environment variables (ORACLE_USER, ORACLE_PASSWORD) in server definition
  - Updated .gitignore for better file management

### 2025-11-27
- **feat**: Add `server.json` to define Oracle MCP server, environment variables, and update related configurations
  - Added server.json with MCP server metadata and schema
  - Updated version to 0.7.5
  - Added mcpName field to package.json
  - Configured environment variables (ORACLE_USER, ORACLE_PASSWORD) in server definition

### 2025-11-25
- **docs**: Add change logs to Oracle and Postgres READMEs
  - Detailed new features such as secure Postgres authentication
  - Documented Toon format encoding integration
  - Added Antigravity Code Editor integration instructions

### 2025-11-20
- **feat**: Add Docker image build for postgres service and remove oracle test script
- **feat**: Add initial Postgres server implementation, integrate ModelContextProtocol SDK, and update Oracle tools
  - Enhanced Oracle tools integration with new MCP SDK features

### 2025-11-19
- **feat**: Encode query and explain plan results using Toon format and add MIME type to stats output
  - Improved data serialization using `toon-format` library for better JSON handling
  - Added MIME type support for stats output
- **docs**: Add instruction for `mcp_config.json` placement in README
  - Clarified configuration file location for Antigravity Code Editor
- **feat**: Add Antigravity Code Editor section to README with image and configuration example
  - Added comprehensive setup instructions for Antigravity integration

### 2025-11-05
- **docs**: Set Oracle MCP server link

### 2025-11-04
- **docs**: Added article about AI pair programming

### 2025-10-30
- **feat**: Added keywords and Gemini Code Assist setting
- **fix**: Fix dependencies
- **docs**: Update README with Gemini CLI prompts demo
- **release**: New release with better tools information

### 2025-07-02
- **chore**: Update version to 0.7.0 and enhance AWR documentation in Oracle server

### 2025-07-01
- **chore**: Update version to 0.6.4 and add AWR functionality in Oracle server
  - Implemented Automatic Workload Repository (AWR) report generation

### 2025-06-17
- **feat**: Update Oracle server package name and instructions for clarity

### 2025-06-13
- **fix**: Correct README and Dockerfile for consistency and clarity

### 2025-06-09
- **feat**: Update Oracle README and configuration for improved clarity and functionality

### 2025-03-20
- **docs**: Correct typo in README and update Docker configuration for local usage

### 2025-03-19
- **docs**: Update README to include stats retrieval and improved execution plan visualization
- **docs**: Update README to include stats functionality and sample Docker configuration
- **feat**: Add stats endpoint for SQL object and update README with Docker AI usage
  - Implemented comprehensive table statistics retrieval

### 2025-03-14
- **docs**: Update README with explain functionality and demo prompts for Oracle MCP server

### 2025-03-13
- **refactor**: Remove inactivity timer and enhance server shutdown handling
- **feat**: Add Oracle MCP server with Docker support and configuration
  - Initial release of Oracle MCP server
