# MCP SuperAssistant v0.6.2

This release builds on v0.6.1 with a critical discovery-state fix, first browser runtime qualification evidence, and full Chrome + Firefox release artifacts.

## What's new

- **Discovery-state fix**: When `tools/list` fails after a connection was established, McpClient now clears the cache, marks the state as disconnected, emits a failure event, and rethrows. Previously it could appear as a healthy connection with zero tools.
- **First Chrome runtime evidence**: Manual smoke test confirmed extension loading, content script activation, and filesystem MCP tool discovery/execution on Z.ai, Qwen AI, and gemini.google.com.
- **Full Firefox qualification**: XPI packaged, loaded as temporary add-on, and manual smoke tested.
- **Qualification documentation suite**: Full support matrix, baseline freeze, known limitations, package baseline, issue coverage ledger, manual browser protocol, and E2E harness plan.
- **Package-contract E2E guard**: CI now verifies browser target, manifest shape, file presence, and archive integrity — preventing the previous zero-test-passing build pipeline.

## Verified gates

- 7 extension tests (5 existing + 2 new discovery-state) — PASS
- Type checking — PASS
- Chrome and Firefox production builds — PASS
- Package-contract E2E guard (Chrome + Firefox mode) — PASS
- MCP protocol E2E suite (13/13) — PASS
- Manual Chrome smoke on 3 chat sites — PASS
- Manual Firefox smoke — PASS
- Guided browser protocol (Chrome + Firefox) — PASS

## Known limitations

- Legacy SSE and WebSocket transports not tested
- Site adapter contracts not fully automated
- Lifecycle/exactly-once coverage not fully automated
- Fixture server E2E requires manual infrastructure setup

See `STABILIZATION_STATUS.md` and `docs/qualification/` for the complete verification boundary.
