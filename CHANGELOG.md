# Changelog

## 0.6.1 - 2026-07-15

### Fixed

- Configure Zod for CSP-safe protocol parsing before MCP SDK schemas are created.
- Replace SDK AJV runtime code generation with a browser-safe JSON Schema validator.
- Preserve valid tool discovery when one server tool exposes an unsupported output schema.
- Support both JSON and SSE-framed Streamable HTTP tool-list responses.
- Wait for ZIP/XPI output streams to finish before reporting packaging success.
- Remove network-only cleanup commands from the build path.

### Added

- Regression tests for issue #199, schema draft selection, malformed schema containment, and Streamable HTTP response framing.
- Production-bundle checks for runtime code-generation tokens, manifest shape, Firefox CSP, and archive integrity.

### Verification boundary

Unit tests, type checking, targeted linting, Chrome/Firefox production builds, bundle scans, and archive integrity checks pass. Repository-wide lint still contains pre-existing failures, and the real-browser/site/proxy matrix remains to be run. See [STABILIZATION_STATUS.md](STABILIZATION_STATUS.md).
