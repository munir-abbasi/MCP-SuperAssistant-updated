# E2E Harness Gap and Follow-up Plan

Status: planning stub only. This document records the current zero-test E2E risk and the bounded follow-up needed for a deterministic browser harness. It does not implement the harness and does not qualify browser runtime behavior.

## Evidence labels

- Verified: directly observed in this checkout through file inspection or command output.
- Claimed: recorded in project documents, issue reports, or build logs but not independently reproduced here.
- Inferred: source-based conclusion that still needs runtime confirmation.
- Unknown: missing or not yet inspected.

## Current E2E gap

| Item | Evidence | Status |
| --- | --- | --- |
| Root Chrome E2E script | `package.json` defines `e2e` as `pnpm zip && turbo e2e`. | Verified |
| Root Firefox E2E script | `package.json` defines `e2e:firefox` as `pnpm zip:firefox && turbo e2e`. | Verified |
| Turbo E2E task | `turbo.json` defines `tasks.e2e` with only `{ "cache": false }`. | Verified |
| CI Chrome E2E job | `.github/workflows/e2e.yml` runs `pnpm e2e`. | Verified |
| CI Firefox E2E job | `.github/workflows/e2e.yml` runs `pnpm e2e:firefox`. | Verified |
| Package-level E2E scripts | Earlier inspection found no package-level `e2e` scripts, so `turbo e2e` has no real package task to execute. | Verified |

Impact: the current root E2E commands can build/package artifacts and still produce a green CI job without running browser tests. This is a release-blocking qualification gap, not proof of browser correctness.

## Progress update after package-contract guard

Status: a nonzero package-contract E2E guard now exists. This is not the full deterministic browser harness described below.

| Item | Evidence | Status |
| --- | --- | --- |
| Root Chrome E2E mode | `package.json` now runs `pnpm zip && cross-env CEB_E2E_BROWSER=chrome turbo e2e`. | Verified |
| Root Firefox E2E mode | `package.json` now runs `pnpm zip:firefox && cross-env CEB_E2E_BROWSER=firefox turbo e2e`. | Verified |
| Package-level E2E task | `tests/e2e/package.json` defines `e2e` as `node --test e2e.test.mjs`. | Verified |
| Chrome package-contract guard | `pnpm e2e` ran `@extension/e2e:e2e`; Node reported 2 tests, 2 pass, 0 fail. | Verified |
| Firefox package-contract guard | `pnpm e2e:firefox` ran `@extension/e2e:e2e`; Node reported 2 tests, 2 pass, 0 fail. | Verified |

The package-contract guard checks that the selected build target is explicit, `dist/manifest.json` matches the selected browser shape, core packaged files are non-empty, and `dist-zip/` contains an archive with the expected `.zip` or `.xpi` extension. It prevents the previous zero-task Turbo success mode, but it still does not install the extension into Chrome or Firefox and does not connect to an MCP fixture service.

Remaining release-blocking gap: implement the deterministic browser/fixture harness below and record browser-runtime evidence by candidate SHA and browser.

## Manual Chrome smoke after package-contract guard

Status: initial blocked/undetermined from CDP auto-install, followed by **successful manual install and tool execution**.

| Phase | Item | Evidence | Status |
| --- | --- | --- | --- |
| T3 | Chrome artifact under probe | `dist-zip/extension-20260716-162040.zip` extracted to `/tmp/opencode/mcpsa-chrome-smoke-20260716-162040`. | Verified |
| T3 | Packaged manifest shape | Extracted manifest is MV3 and uses `background.service_worker: "background.js"`. | Verified |
| T3 | Browser launch via CDP | `/usr/bin/ungoogled-chromium` launched with `--load-extension` and `--disable-extensions-except` pointing at the extracted artifact. | Verified |
| T3 | Page target | CDP reported `Chrome/150.0.7871.124`, protocol `1.3`, and a `https://chatgpt.com/` page target; Playwright attached to the tab. | Verified |
| T3 | Extension registration via CDP | CDP listed no extension/service-worker/background target; profile extension settings listed only built-in Chromium PDF Viewer; `chrome://extensions/` had no MCP SuperAssistant card; ChatGPT DOM had no MCP/SuperAssistant/sidebar artifacts. | Blocked/undetermined |
| T4 | Manual install | Extension loaded manually in ungoogled-chromium. Extension card visible and enabled in `chrome://extensions`. | **Pass** |
| T4 | Content script activation | Extension UI injected on Z.ai, Qwen AI, and gemini.google.com. | **Pass** |
| T4 | MCP tool discovery | Filesystem MCP server discovered and tools listed correctly. | **Pass** |
| T4 | MCP tool execution | Filesystem tool calls (read file/list directory) executed, results returned. | **Pass** |

Interpretation: T3 CDP auto-install failure was environment/tooling specific. Manual installation succeeded and confirmed basic MCP discovery and execution on 3 sites. This is first Chrome runtime qualification evidence, but not yet a full guided browser protocol covering all release gates.

## Required follow-up scope

The follow-up implementation must stay bounded to deterministic qualification infrastructure:

1. Add a deterministic MCP fixture service with scenario selection for Streamable HTTP JSON, SSE-framed POST, malformed responses, slow calls, cancellation, concurrent calls, valid/invalid schemas, structured errors, and oversized result cases.
2. Add package-level E2E scripts so `turbo e2e` executes real tasks and fails when zero tests run.
3. Run Chrome tests against files extracted from the final candidate ZIP, not a loose development directory.
4. Provide a Firefox route that is either automated and clearly named, or a documented manual gate that is not misrepresented as automation.
5. Store evidence by candidate SHA and browser: environment details, artifact hashes, browser/background/page logs, fixture logs, results JSON, screenshots or traces for failures, and manifest/background load errors.
6. Avoid authenticated live-site dependency in CI; use stable DOM adapter fixtures for deterministic coverage and keep uncontrolled live-site smoke tests as release evidence only.
7. Make manifest load errors, background errors, zero tests executed, and fixture startup failures fatal.

## Acceptance criteria for implementation

- `pnpm e2e` fails if no package-level tests execute.
- `pnpm e2e:firefox` fails if no Firefox route or explicit manual gate evidence is produced.
- Chrome E2E records the exact ZIP path and SHA-256 used for loading.
- Firefox E2E or manual gate records the exact XPI path, SHA-256, and install mode.
- Test evidence distinguishes archive integrity, browser install/load, background runtime health, content-script activation, MCP fixture connection, tool discovery, tool execution, result rendering, reload/reconnect behavior, and supported-site adapter coverage.
- Sanitized logs do not include cookies, authorization headers, personal prompts, tool arguments, or raw tool results.

## Out of scope for this stub

- Implementing the fixture service.
- Adding browser automation dependencies.
- Changing CI workflow behavior.
- Claiming Chrome or Firefox runtime qualification.
- Downgrading or expanding the support matrix.

## RUNTIME STATUS

### Chrome manual — partially qualified
- **Verified**: Extension installed manually, content scripts activated, MCP filesystem server discovered and executed tool calls on Z.ai, Qwen AI, and gemini.google.com.
- **Not yet verified**: Chrome automated install via CDP (`--load-extension`); guided browser protocol for all release gates (steps 2–11); reload/reconnect behavior; SPA navigation; auto-submit; large payload handling.
- **Next**: Run guided browser protocol (`docs/qualification/manual-browser-protocol.md`) on the same candidate.

### Firefox — not qualified
- No install/load, background, content-script, or MCP fixture verification completed.
- **Next**: Build candidate XPI, install manually, run Firefox equivalent of guided protocol.

Release claim prohibited until both browsers pass the guided protocol. These E2E notes and partial Chrome evidence do not make the current artifacts fully browser-qualified, release-qualified, or stable.
