# Chrome and Firefox release readiness

Define the supported matrix before calling the extension stable. Use exact browser versions, target sites, transports, extension artifact, proxy version and MCP protocol range.

## Gate 1: deterministic unit and contract tests

Require tests for:

- `tools/list` JSON and SSE-framed responses, schemas, unknown metadata and partial/malformed items;
- transport state machine: connect, concurrent connect, disconnect, rapid reconnect, worker restart and server restart;
- JSONL/XML incremental parsing, embedded triple backticks, multiline string values, localized copy labels and incomplete streams;
- argument type preservation, especially strings containing valid JSON/XML/code;
- exactly-once tool-call dispatch, timeout, cancellation, retry and error propagation;
- large text, structured content, base64 image and unsupported content with explicit size budgets;
- storage migrations, tool enablement, profiles/settings and cache invalidation;
- manifest generation and required packaged files for both browsers.

## Gate 2: adapter contract

Every declared supported site must pass the same contract:

1. activate only on intended origins/routes;
2. mount sidebar/popover once without damaging host hydration or native controls;
3. survive SPA navigation and remount idempotently;
4. locate the active editor using semantic selectors and observable fallbacks;
5. insert plain text, multiline JSON, XML and fenced code into the controlled editor;
6. confirm the host application recognized inserted content;
7. submit and confirm state transition rather than assuming `.click()` worked;
8. recognize complete streaming function calls and ignore incomplete/ordinary code blocks;
9. show Run exactly once and auto-execute at most once;
10. insert/render result and structured error without freezing;
11. preserve native editing, uploads, tools, fork/edit controls and keyboard behavior;
12. clean up observers, listeners, timers and injected nodes on teardown.

Maintain selectors as per-site modules with fixture/snapshot evidence and a last-verified date. A site is unsupported when its contract is not tested; do not leave it advertised as supported on historical evidence.

## Gate 3: real-browser core matrix

At minimum, test the current stable Chrome and Firefox releases on Linux and one additional major desktop OS when release scope permits.

For each browser, verify:

- unpacked/temporary development artifact and final ZIP/package;
- clean install and upgrade from the last published version;
- manifest, icons, permissions, CSP and background context;
- ChatGPT plus at least one non-ProseMirror supported site;
- Streamable HTTP and SSE; WebSocket if advertised;
- connect, discover, enable, instruction insertion, manual Run, auto-execute, result insertion, auto-submit, reconnect and reload;
- worker/background suspension, SPA navigation, locale variation and narrow viewport;
- a safe read-only tool and a deliberately failing tool;
- no duplicate execution after reconnect or timeout.

## Gate 4: performance and soak

- Run repeated connect/disconnect and tool-discovery cycles while tracking sessions, listeners, observers, timers and memory.
- Soak the proxy with multiple browser sessions and interrupted SSE connections.
- Establish payload budgets and test near/over limits. Never inject megabytes of base64 into the chat DOM.
- Measure sidebar mount time, long-task duration and memory before/after large results.
- Confirm cleanup after tab close, extension reload, server restart and network interruption.

## Gate 5: security/privacy

- Inspect source and built bundles for unexpected endpoints, telemetry, secrets, remote code, `eval`/`new Function`, and debug globals.
- Verify extension messages authenticate expected context/shape and do not accept arbitrary webpage commands.
- Minimize host permissions and document why each remaining origin is needed.
- Redact authorization headers and tool arguments/results from logs and analytics.
- Store bearer tokens or similar credentials only with an explicit threat model and user-visible controls.
- Confirm CSP remains strict and all schema/parser paths are CSP-safe.
- Review HTML rendering for injection and Trusted Types behavior.

## Gate 6: release evidence

Publish or retain:

- support matrix and known limitations;
- issue coverage ledger;
- exact commands and results;
- browser test evidence tied to commit and packaged artifact hashes;
- dependency and license audit;
- rollback package and migration path;
- reproducible build/package instructions;
- changelog mapping fixes to issues without overclaiming.

## Stop conditions

Do not release as stable if any of these remain in the declared matrix:

- connected state can hide failed discovery;
- tool calls may execute more than once;
- reconnect can crash the proxy or leak sessions;
- valid tool schemas fail under extension CSP;
- supported-site insertion/submit is unverified;
- large results can freeze a tab;
- Chrome passes but Firefox package/runtime is untested;
- security-critical scanner claims have neither been validated nor dispositioned.
