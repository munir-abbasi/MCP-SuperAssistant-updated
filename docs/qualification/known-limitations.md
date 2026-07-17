# Known Limitations

Status: baseline record for v0.6.2-rc.1. This document truthfully documents behavior that is not fully supported, not yet qualified, or intentionally limited. It is updated as qualification evidence accumulates.

## Browser qualification

- **Firefox**: Not yet runtime-qualified in this qualification pass. No real-browser install/load, background runtime, content-script activation, or MCP fixture verification completed.
- **Chrome (ungoogled-chromium)**: Manual runtime verified on Z.ai, Qwen AI, and gemini.google.com with filesystem MCP tool execution. Not yet verified through a full guided browser protocol covering all release gates.
- **Extension auto-install from CDP**: Earlier automated attempts via `--load-extension` with CDP did not register the extension in `chrome://extensions/`. Manual installation succeeded. The CDP registration failure was environment/tooling, not a source defect.

## Site support

- **ChatGPT**: Not qualified yet. No adapter contract evidence (mount once, insert, execute, submit) in this pass.
- **Perplexity, Grok/X/Twitter, OpenRouter, DeepSeek, Mistral, GitHub Copilot, Kimi, Kagi, and others in manifest match patterns**: Experimental/unqualified. Manifest match patterns are packaging scope only — they do not constitute qualified support.
- **Z.ai, Qwen AI, Gemini**: Manual tool execution confirmed but not through full adapter contract. Insertion/submission by host state transition not proven.
- **One non-ProseMirror site**: Not selected or tested. Required to avoid single-editor false confidence.

## Transports

- **Streamable HTTP**: JSON and SSE-framed POST responses pass deterministic tests. Browser runtime verified manually for basic discovery/execution.
- **Legacy SSE**: Not tested in this qualification pass. Status: unknown.
- **WebSocket**: Not tested in this qualification pass. Status: unknown.

## Discovery and state

- **Degraded/partial capability failure**: Reported as disconnected/error state. The fix clears cache, marks disconnected, emits failure, and rethrows. Transport-level degraded states (e.g., some tools fail but connection remains) are not separately represented.
- **Reconnect**: Not tested in this pass. Connect/disconnect lifecycle is idempotent in source but not browser-verified for proxy restart, network interruption, or service-worker suspension.

## Exactly-once execution

- **Cancellation**: Not tested. Concurrent tool calls, late responses after timeout, and duplicate execution prevention are not browser-verified.
- **Request ID uniqueness**: Source design supports unique IDs but no browser evidence gathered.

## Payload handling

- **Payload budgets**: No explicit budgets defined for inline text size, JSON depth/nesting, image/base64 size, streaming buffer, or render time.
- **Base64/large results**: No bounded truncation, preview, or safe attachment path verified for oversized results.
- **Malformed JSON-RPC**: Deterministic test coverage exists for transport framing errors. Not tested in browser context.

## Security and privacy

- **Full security review**: Not completed in this pass. Prior CSP scan found no `unsafe-eval` in packaged bundles. No message-origin validation, host-permission minimization, `web_accessible_resources` audit, token/log redaction, or DOM injection boundary review has been rerun for the current candidate.
- **Analytics**: `chrome-extension/utils/analytics.ts` has modifications in the working tree not reviewed for privacy impact.

## Persistence and settings

- **Enable/disable persistence**: Not tested.
- **Storage migration**: Not tested for upgrade from previous version.
- **Corrupt storage handling**: Not tested.
- **Multiple tabs**: Not tested for concurrent sidebar instances.
- **Viewport/accessibility**: Not tested.

## Build and tooling

- **Lint baseline**: 704 pre-existing lint errors across untouched files in the repository. Changed files must pass targeted lint, but no effort was made to reduce the baseline count.
- **Browserslist stale**: 17 months old at time of baseline. Not updated.
- **Vite build warnings**: `vite-plugin-lib-assets` emits non-fatal warnings for TypeScript imports with `.js` specifiers. Vite resolves and bundles correctly; these are upstream noise.
- **E2E harness**: Only a package-contract guard exists (checks manifest, files, archive). No browser test harness implemented. Root `pnpm e2e` passes without running any browser tests.

## Upstream issues not reproduced

Several upstream issues (#191, #176, #171, #158, #87, #12) are classified as "plausible defects needing reproduction" — they may share symptoms with the discovery-state fix but have not been reproduced against their own distinctive payloads. They are not claimed fixed.

## Rollback and migration

- **Downgrade safety**: Not tested. Previous v0.6.0 persisted state may be incompatible with v0.6.1 storage formats.
- **Rollback artifact**: A pre-existing root ZIP/XPI from an earlier build exists but its provenance is not fully documented.
