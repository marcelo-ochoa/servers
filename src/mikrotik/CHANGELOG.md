## Change Log

### 2026-01-08
- **docs**: Updated documentation with Docker examples and License information

### 2026-01-07
- **feat**: Initial MikroTik MCP server implementation
  - Added support for connecting to MikroTik routers via RouterOS API
  - Implemented `mk-connect`, `mk-report`, and `mk-print` tools
  - Added support for optional host/secure startup arguments
  - Integrated with `MK_USER` and `MK_PASSWORD` environment variables
  - Implemented basic and secure (TLS) connection modes