---
description: A Model Context Protocol server that provides read-only access to Oracle Database
applyTo: "src/{oracle,mysql,postgres}/**"
---
# AI Agent Project Instructions: Oracle Server

## Overview
This project is part of a modular AI Agent system, with each module providing a specific capability. The `src/oracle` directory implements the Oracle server, which enables the AI Agent to interact with Oracle databases and perform related operations.

## Technology Stack for `src/oracle`, `src/mysql` and `src/postgres`

- **Programming Language:** TypeScript (Node.js)
- **Package Management:** npm (Node Package Manager)
- **Build System:** TypeScript compiler (`tsc`)
- **Containerization:** Docker (see `Dockerfile`)
- **Configuration:** Project-specific configuration files (e.g., `tsconfig.json`, `package.json`)

## TypeScript Guidelines
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators

### Key Files

#### Oracle Server (`src/oracle/`)
- `index.ts`: Main entry point for the Oracle server logic
- `server.ts`: Server initialization and MCP protocol setup
- `db.ts`: Database connection and query execution logic
- `handlers.ts`: Request handlers for tools and resources
- `tools.ts`: Tool definitions (query, explain, stats, connect, awr)
- `tools/`: Individual tool implementations
  - `query.ts`: Execute read-only SQL queries
  - `explain.ts`: Generate execution plans
  - `stats.ts`: Retrieve table statistics
  - `connect.ts`: Database connection management
  - `awr.ts`: Automatic Workload Repository reports
- `package.json`: Dependencies and scripts
- `server.json`: MCP server metadata and registry configuration
- `tsconfig.json`: TypeScript configuration
- `Dockerfile`: Docker image build instructions
- `README.md`: Comprehensive usage and configuration guide

#### MySQL Server (`src/mysql/`)
- `index.ts`: Main entry point for the MySQL server logic
- `server.ts`: Server initialization and MCP protocol setup
- `db.ts`: Database connection and query execution logic
- `handlers.ts`: Request handlers for tools and resources
- `tools.ts`: Tool definitions (mysql-query, mysql-explain, mysql-stats, mysql-connect, mysql-awr)
- `tools/`: Individual tool implementations
  - `query.ts`: Execute read-only SQL queries
  - `explain.ts`: Generate execution plans
  - `stats.ts`: Retrieve table statistics
  - `connect.ts`: Database connection management
  - `awr.ts`: MySQL performance reports (AWR-style)
- `package.json`: Dependencies and scripts
- `server.json`: MCP server metadata and registry configuration
- `tsconfig.json`: TypeScript configuration
- `Dockerfile`: Docker image build instructions
- `README.md`: Comprehensive usage and configuration guide

#### PostgreSQL Server (`src/postgres/`)
- `index.ts`: Main entry point for the PostgreSQL server logic
- `server.ts`: Server initialization and MCP protocol setup
- `db.ts`: Database connection and query execution logic
- `handlers.ts`: Request handlers for tools and resources
- `tools.ts`: Tool definitions (pg-query, pg-explain, pg-stats, pg-connect, pg-awr)
- `tools/`: Individual tool implementations
  - `query.ts`: Execute read-only SQL queries
  - `explain.ts`: Generate execution plans
  - `stats.ts`: Retrieve table statistics
  - `connect.ts`: Database connection management
  - `awr.ts`: PostgreSQL performance reports (AWR-style)
- `package.json`: Dependencies and scripts
- `server.json`: MCP server metadata and registry configuration
- `tsconfig.json`: TypeScript configuration
- `Dockerfile`: Docker image build instructions
- `README.md`: Comprehensive usage and configuration guide

## How It Works
- The Oracle server is written in TypeScript and is designed to be run as a Node.js application.
- It can be built and run locally or inside a Docker container for deployment.
- The server exposes endpoints or interfaces for the AI Agent to query Oracle databases, execute SQL, and retrieve results.

## Development Workflow
1. **Install Dependencies:**
   ```sh
   npm install
   ```
2. **Build the Project:**
   ```sh
   npm run build
   ```
3. **Run the Server (Locally):**
   ```sh
   npx -y @marcelo-ochoa/server-oracle localhost:1521/freepdb1
   npx -y @marcelo-ochoa/server-mysql localhost:3306/mydb
   npx -y @marcelo-ochoa/server-postgres localhost:5432/postgres
   ```
4. **Run with Docker:**
   Build the Docker image and run the container:
   ```sh
   docker build -t mochoa/mcp-oracle -f src/oracle/Dockerfile .
   docker build -t mochoa/mcp-mysql -f src/mysql/Dockerfile .
   docker build -t mochoa/mcp-postgres -f src/postgres/Dockerfile .
   ```

## Notes
- Ensure you have Node.js and npm installed for local development.
- For Docker-based workflows, ensure Docker is installed and running.
- The Oracle server may require environment variables or configuration for database connection (see `README.md` for details).

## Additional Resources
- See the `README.md` in `src/oracle`, `src/mysql` and `src/postgres` for usage, configuration, and advanced options.
- Refer to the root project `README.md` for information about the overall AI Agent system and other modules.
