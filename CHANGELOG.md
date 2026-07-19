# Changelog

## 0.6.3-rc.7 - 2026-07-19

### Fixed

- Fixed Qwen Monaco/JSONL rendering after live Qwen runtime showed virtualized code blocks exposing only the first visible line in the original `pre.qwen-markdown-code`. The extension now waits for complete extracted JSONL before creating hidden Qwen pre elements, preventing stale `function_call_start`-only blocks from freezing as stalled UI.
- Fixed Qwen renderer targeting so it no longer parses Qwen's original hydrated Monaco `pre`/`code` wrappers. Qwen rendering now uses only hidden extracted pre elements produced by the CodeMirror/Monaco accessor, reducing stale stalled blocks and React hydration conflicts.
- Fixed a CodeMirror accessor cleanup crash by replacing iterable cleanup over a `WeakSet` with an iterable `Set` and explicit editor cleanup.
- Restored ChatGPT sidebar resilience when ChatGPT removes the sidebar shadow host during hydration/remount while the persisted sidebar state says it should remain visible.

### Changed

- Added regression coverage for Qwen full Monaco model extraction, React-backed JSONL fallback extraction, incomplete-first-line deferral, and Qwen selector restrictions.
- Kept the initial-load SSE 404 behavior unchanged; live testing showed it clears after selecting the desired transport and was not treated as this release candidate's blocker.

## 0.6.3-rc.6 - 2026-07-19

### Fixed

- Added a Qwen-specific strict JSONL instruction template so Qwen no longer receives the generic `<thoughts>`/response-format scaffold that it copied into live output. The Qwen path now requires exactly one complete fenced `jsonl` function-call block with `function_call_start`, all required `parameter` lines, and the matching `function_call_end`, then tells the model to stop and wait for the extension result.

### Changed

- Preserved the existing generic, ChatGPT, and Gemini instruction behavior for non-Qwen hosts while routing only Qwen hosts through the stricter template.
- Added regression coverage proving Qwen instructions omit `<thoughts>`, manual-execution wording, JSON-array wording, and custom XML-style tags while the non-Qwen generic template remains unchanged.

## 0.6.3-rc.5 - 2026-07-18

### Fixed

- Bounded Qwen JSON function-call spinner handling by monitoring the actual rendered function-block ID after rendering. This allows the existing abrupt-end monitor to find incomplete JSON function blocks and move them out of indefinite loading instead of leaving a continuous spinner beside fallback labels.
- Improved partial JSON function-call extraction when Qwen prefixes natural-language text before an incomplete `function_call_start` object, so the renderer can recover the function name and call ID more often instead of displaying `function` / generated `block-*` fallback values.

### Changed

- Adjusted JSONL instructions so models emit a complete function-call block and stop for extension-provided execution controls, rather than asking the user to manually execute JSONL lines.
- Added regression coverage for polluted partial JSON function-call starts.

## 0.6.3-rc.4 - 2026-07-18

### Fixed

- Fixed JSON function-call extraction for Qwen-style polluted or compact JSONL output. Detection already found JSON function calls in noisy DOM text, but later name/call-id extraction still assumed one clean JSON object per line, causing rendered fallback labels like `function` and generated `block-*` IDs. Extraction now reuses the robust JSON-object candidate normalization path before deriving function name, call ID, description, and parameters.

### Changed

- Added regression coverage for compact/noisy JSONL function-call text and incomplete streaming `function_call_start` fallback extraction.

## 0.6.3-rc.3 - 2026-07-18

### Fixed

- Fixed Chrome/Firefox manifest icon packaging for release-candidate builds. The packaged manifest referenced `icon-16.png`, but `v0.6.3-rc.2` did not include that file, causing Chrome to reject the unpacked extension with `Could not load icon 'icon-16.png' specified in 'icons'`. The source now includes a real 16x16 PNG icon generated from the existing extension icon asset.

### Changed

- Added package-contract coverage that verifies every icon path declared by the generated manifest exists in `dist` before E2E packaging passes.

## 0.6.3-rc.2 - 2026-07-18

### Fixed

- Fixed Chrome/Firefox manifest compatibility for release-candidate builds. The packaged manifest now uses numeric `version` (`0.6.3`) and preserves the full release-candidate label in `version_name` (`0.6.3-rc.2`). This supersedes `0.6.3-rc.1`, whose manifest used `0.6.3-rc.1` in `version` and could not be loaded by Chrome.

### Changed

- Added package-contract coverage that rejects non-numeric manifest `version` values and verifies `version_name` matches the package release label.

## 0.6.3-rc.1 - 2026-07-18

### Fixed

- MCP reconnect after discovery failure: `McpClient.performConnection()` now always cleans up existing client, plugin, transport, cache, and timers before opening a new connection, even when `isConnectedFlag` was already marked false by a failed primitive discovery refresh.
- MCP connection timeout handling now clears the timeout timer after successful connection, preventing successful reconnect tests from leaving a pending 30-second timer.

### Added

- Regression coverage for reconnecting after a `tools/list`/primitive discovery failure and then completing a tool call.
- Regression coverage for bounding a tool call that never resolves.

### Verification boundary

Automated validation in this checkout: targeted discovery-state test PASS, `pnpm -F chrome-extension test` PASS (14 tests), `pnpm -F chrome-extension type-check` PASS, targeted ESLint for the edited discovery-state test PASS, `pnpm e2e` PASS (15 tests), `pnpm e2e:firefox` PASS (15 tests), and package integrity/CSP-token scan PASS for the final Chrome ZIP and Firefox XPI. Repository-wide `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt. Chrome/Firefox runtime verification on chat.qwen.ai was not run in this session.

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
