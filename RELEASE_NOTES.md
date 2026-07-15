# MCP SuperAssistant v0.6.1

This stabilization release fixes MCP tool discovery failures caused by browser-extension Content Security Policy restrictions and schema-validator runtime code generation.

Highlights:

- CSP-safe MCP SDK and JSON Schema validation path.
- Exact `@modelcontextprotocol/sdk` 1.25.2 dependency pin.
- Issue #199 regression coverage and malformed-schema containment.
- JSON and SSE-framed Streamable HTTP response coverage.
- Reliable Chrome ZIP and Firefox XPI creation with integrity verification.

Verified gates: 5 extension tests, type checking, targeted ESLint, Chrome and Firefox production builds, strict manifest/CSP checks, packaged-bundle runtime-generation scan, and ZIP/XPI integrity tests.

This is a pre-release because real Chrome/Firefox testing across live sites and proxy transports was not available in the build environment. See `STABILIZATION_STATUS.md` for the exact verification boundary.
