## Change Log

### 2026-01-16
- **feat**: Added `mk-awr` tool for automated performance and security reports including log auditing.
- **refactor**: Renamed `mk-print` tool to `mk-get` for better alignment with other MCP segments.
- **docs**: Added `Demos.md` with usage examples for Claude Desktop, Gemini CLI, and Antigravity.
- **chore**: Updated version to 1.0.2 and synchronized `server.json` and `package.json`.

### 2026-01-08
- **feat**: Improved login handling to correctly detect `!trap` responses
- **docs**: Updated documentation with Docker examples and License information

### 2026-01-07
- **feat**: Initial MikroTik MCP server implementation
  - Added support for connecting to MikroTik routers via RouterOS API
  - Implemented `mk-connect`, `mk-report`, and `mk-print` tools
  - Added support for optional host/secure startup arguments
  - Integrated with `MK_USER` and `MK_PASSWORD` environment variables
  - Implemented basic and secure (TLS) connection modes