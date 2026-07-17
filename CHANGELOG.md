# Changelog

## 0.6.2-rc.1 - 2026-07-17

### Fixed

- McpClient discovery-state: failed `listTools()` now clears the cache, marks state as disconnected, emits a failure event, and rethrows — preventing a stale healthy/zero-tools appearance.
- analytics.ts: privacy and compatibility adjustments.

### Added

- Discovery-state regression tests: primitive discovery failure while transport health is true, and stale-cache invalidation after forced failure.
- Qualification documentation suite: support matrix, baseline freeze, known limitations, package baseline, issue coverage ledger, manual browser protocol, and E2E harness plan.
- Package-contract E2E guard: verifies browser target, manifest shape, core file presence, and archive integrity before CI reports success.
- Manual Chrome runtime smoke: extension loaded, content scripts activated, filesystem MCP tools discovered and executed on Z.ai, Qwen AI, and gemini.google.com.

### Changed

- Version bumped to 0.6.2-rc.1.

### Verification boundary

All prior v0.6.1 gates continue to pass. New tests (7 total) and package-contract E2E guard pass. Chrome manual smoke qualifies basic browser runtime. Firefox and full guided browser protocol deferred to v0.6.2.

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
