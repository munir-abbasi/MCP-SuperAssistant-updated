# MCP SuperAssistant v0.6.2-rc.1

This release candidate builds on v0.6.1 with a critical discovery-state fix and the first browser runtime qualification evidence.

## What's new

- **Discovery-state fix**: When `tools/list` fails after a connection was established, McpClient now clears the cache, marks the state as disconnected, emits a failure event, and rethrows. Previously it could appear as a healthy connection with zero tools.
- **First Chrome runtime evidence**: Manual smoke test confirmed extension loading, content script activation, and filesystem MCP tool discovery/execution on Z.ai, Qwen AI, and gemini.google.com.
- **Qualification documentation suite**: Full support matrix, baseline freeze, known limitations, package baseline, issue coverage ledger, manual browser protocol, and E2E harness plan.
- **Package-contract E2E guard**: CI now verifies browser target, manifest shape, file presence, and archive integrity — preventing the previous zero-test-passing build pipeline.

## Verified gates

- 7 extension tests (5 existing + 2 new discovery-state) — PASS
- Type checking — PASS
- Chrome and Firefox production builds — PASS
- Package-contract E2E guard (Chrome + Firefox mode) — PASS
- Manual Chrome smoke on 3 chat sites — PASS

## Known gaps (for v0.6.2)

- Firefox runtime not yet loaded/qualified
- Full guided browser protocol not yet executed
- Site adapter contracts not verified
- Lifecycle/exactly-once coverage not tested
- Legacy SSE and WebSocket transports not tested

This is a pre-release because the full browser matrix has not been executed. See `STABILIZATION_STATUS.md` and `docs/qualification/` for the exact verification boundary.
