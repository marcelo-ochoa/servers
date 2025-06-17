---
applyTo: "src/oracle/**"
---
# AI Agent Project Instructions: Oracle Server

## Overview
This project is part of a modular AI Agent system, with each module providing a specific capability. The `src/oracle` directory implements the Oracle server, which enables the AI Agent to interact with Oracle databases and perform related operations.

## Technology Stack for `src/oracle`

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
- `index.ts`: Main entry point for the Oracle server logic.
- `package.json`: Lists dependencies and scripts for building/running the server.
- `tsconfig.json`: TypeScript configuration for compilation.
- `Dockerfile`: Instructions for building a Docker image of the Oracle server.
- `gordon-mcp.yml`: (If present) May provide additional configuration for deployment or orchestration.

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
   npm start
   ```
4. **Run with Docker:**
   Build the Docker image and run the container:
   ```sh
   docker build -t oracle-server .
   docker run -p 8080:8080 oracle-server
   ```

## Notes
- Ensure you have Node.js and npm installed for local development.
- For Docker-based workflows, ensure Docker is installed and running.
- The Oracle server may require environment variables or configuration for database connection (see `README.md` for details).

## Additional Resources
- See the `README.md` in `src/oracle` for usage, configuration, and advanced options.
- Refer to the root project `README.md` for information about the overall AI Agent system and other modules.
