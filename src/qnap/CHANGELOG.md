# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-02-10

### Added
- **Enhanced qnap-report Tool**: Completely rewritten in native TypeScript for better performance and reliability.
  - Replaced Python-based report collector with native Node.js implementation.
  - Returns structured **JSON format** instead of plain text, perfect for AI parsing.
  - Added detailed **Disk Health** (model, serial, capacity, temperature, health status).
  - Added granular **Resource Usage** (CPU load, memory breakdown, uptime, system temperature).
  - Added comprehensive **Storage Info** (volume labels, total/used/free space, usage percentages).

## [1.0.1] - 2026-02-09

### Changed
- **Major refactoring for improved maintainability**: Restructured codebase following MySQL MCP server patterns
  - Separated tool handlers into individual files in `tools/` directory (`connect.ts`, `report.ts`, `dir.ts`, `file_info.ts`)
  - Simplified `handlers.ts` to act as a clean dispatcher using a handler registry pattern
  - Refactored `tools.ts` to use array-based tool definitions for consistency
  - Updated `server.ts` to use the new handler dispatcher
  - Improved code organization with better separation of concerns
  - Enhanced error handling and validation in individual tool handlers
  - Added connection state management helper functions

### Added
- **Prompts array support**: Added prompts capability following MikroTik MCP server pattern
  - Implemented `prompts/list` request handler for better tool discoverability
  - Added prompts for all available tools: `qnap-connect`, `qnap-report`, `qnap-dir`, `qnap-file-info`
  - Enhanced server capabilities to include prompts interface

## [1.0.0] - 2026-01-27

### Added
- Initial implementation of the QNAP MCP server.
- Tools: `qnap-connect`, `qnap-report`, `qnap-dir`, `qnap-file-info`.
- Support for QTS Legacy CGI API.

