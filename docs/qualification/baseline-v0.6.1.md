# Baseline Freeze: v0.6.1

Status: qualification baseline freeze for v0.6.1, recorded before code-bearing changes toward v0.6.2-rc.1.

This document freezes the repository and environment state for the current v0.6.1 checkout. Artifact hashes, build results, and test results are recorded from the working tree. This baseline is the reference point against which the next candidate is compared.

## Evidence labels

- **Verified**: directly confirmed from this checkout, command output, source inspection, test output, packaged artifact inspection, or real-browser run.
- **Claimed**: stated by an issue, release note, status document, or reporter, but not independently reproduced in this qualification pass.
- **Inferred**: supported by source inspection or consistent project evidence, but not runtime-verified.
- **Unknown**: not yet inspected or not enough evidence.

## Checkout state

| Field | Value | Evidence |
| --- | --- | --- |
| Repository | `munir-abbasi/MCP-SuperAssistant-updated` | Verified: `git remote -v` |
| Upstream | `srbhptl39/MCP-SuperAssistant` | Verified: `git remote -v` |
| Active branch | `main` | Verified: `git branch --show-current` |
| HEAD | `6abee1dfc1bdb7287c450e1b5794369b4e93e02f` | Verified: `git rev-parse HEAD` |
| HEAD description | `v0.6.1-1-g6abee1d` (1 commit after v0.6.1 tag) | Verified: `git describe --tags --always` |
| Git tag | `v0.6.1` present | Verified: `git tag --list` |
| Working tree | Dirty (see below) | Verified: `git status --short` |
| Package version | `0.6.1` (root and `chrome-extension/package.json`) | Verified |
| MCP SDK | `1.25.2` (exact pin) | Verified |
| Node required | `.nvmrc` `22.12.0`; `engines >=22.12.0` | Verified |
| Node used | `v24.12.0` | Verified |
| pnpm required/used | `9.15.1` | Verified |
| Lockfile SHA-256 | `f9644871e1255c090e2eb1de91559d278e25fb5a2d23d70acf2c03821c9af972` | Verified: `sha256sum pnpm-lock.yaml` |
| OS | Fedora Linux 44, kernel 7.1.3-200.fc44.x86_64 | Verified: `uname -a` |

## Recent commit history

```text
6abee1d docs: add original author attribution to srbhptl39/MCP-SuperAssistant
3300bbd fix: correct double /releases/ URL in README manual installation link
8f6c108 fix: remove stale Chrome Web Store and Firefox Add-ons badges
3e8c674 fix: update README.md with correct v0.6.1 references and Node.js version
7449684 release: stabilize MCP SuperAssistant v0.6.1 (tagged v0.6.1)
```

## Working-tree modifications (beyond v0.6.1 tag)

### Modified tracked files

| File | Change |
| --- | --- |
| `chrome-extension/src/mcpclient/core/McpClient.ts` | 7 insertions, 9 deletions: discovery-state fix (clears cache, marks disconnected, emits failure, rethrows) |
| `chrome-extension/utils/analytics.ts` | Modified |
| `package.json` | Modified |
| `.gitignore` | Modified |
| `README.md` | Modified |
| `STABILIZATION_STATUS.md` | Modified |

### Untracked files added

| File | Purpose |
| --- | --- |
| `chrome-extension/tests/mcp-client-discovery-state.test.ts` | Discovery-state regression tests (88 lines) |
| `tests/e2e/e2e.test.mjs` | Package-contract E2E guard |
| `tests/e2e/package.json` | Package-level E2E script |
| `docs/qualification/*.md` | Qualification documentation suite |
| `docs/DEFERRED_ISSUES_PLAN.md` | Deferred issues plan |
| `docs/REVISED-DEFFERRED-ISSUES-PLAN.md` | Revised plan |
| `artifacts/qualification/` | Qualification artifacts directory |

## Build and test results

| Gate | Result | Evidence |
| --- | --- | --- |
| `pnpm -F chrome-extension test` | PASS: 7 tests, 7 pass, 0 fail | Verified (latest run) |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm build` | PASS: 12 tasks successful | Verified (latest run) |
| `pnpm build:firefox` | PASS: 12 tasks successful | Verified (latest run) |

### Test inventory

| Test file | Tests | Scope |
| --- | --- | --- |
| Schema-related tests (existing) | 2 | Issue #199 schema, draft selection, mixed valid/invalid metadata |
| `streamable-http-framing.test.ts` (existing) | 2 | JSON and SSE-framed Streamable HTTP discovery |
| `mcp-client-discovery-state.test.ts` (new) | 2 | Primitive discovery failure while transport health true; stale-cache reuse after forced failure |

## Package artifacts

| Artifact | Size bytes | SHA-256 | Label |
| --- | --- | --- | --- |
| `dist-zip/extension-20260716-154944.zip` | 2717058 | `2dbcd474d7a014fc07b7253e09631ae690284a65835fff0f16c132b233da6fc1` | Verified |
| `dist-zip/extension-20260716-155124.xpi` | 2717103 | `ccbf7dd011afbfb919c22b26a05e2be8bbd585625e6b4ce31723de5f5b035a3f` | Verified |

### Pre-existing root artifacts (untouched by this pass)

| Artifact | SHA-256 | Label |
| --- | --- | --- |
| `MCP-SuperAssistant-0.6.1-chrome.zip` | `3379868f506083067f1a82c494067ae8c09bef12a79d189b364d8b2b5eecc148` | Verified |
| `MCP-SuperAssistant-0.6.1-firefox.xpi` | `1a559c94b34037117e7e7db8ae53281dc11e7dab9b22163acad2075d63347eff` | Verified |

### Archive contents

Both Chrome ZIP and Firefox XPI contain 18 files: 5 cover images, `background.js`, `codemirror-accessor.js`, `content.css`, `dragDropListener.js`, 2 icon files, `json_function_call_extractor.js`, `manifest.json`, `content/index.css`, `content/index.iife.js`, `content/logo.svg`, `_locales/ko/messages.json`, `_locales/en/messages.json`.

## Browser runtime evidence

| Browser | OS | Status | Evidence |
| --- | --- | --- | --- |
| Chrome/Chromium (ungoogled-chromium) | Fedora Linux | **Manual PASS**: extension loaded, content scripts activated, filesystem MCP server discovered and executed tool calls | Manual test: custom instructions → chat interface requested file audit → filesystem MCP tool calls activated and completed on Z.ai, Qwen AI, and gemini.google.com |
| Firefox | Linux | Not qualified yet | No current real-browser run recorded |

## What is verified in this baseline

- Schema/`outputSchema`/CSP-safe handling (#199) — deterministic tests pass
- Streamable HTTP JSON and SSE-framed POST discovery — deterministic tests pass
- Primitive discovery failure state (advertised tools + `tools/list` fails) — new regression test passes
- Stale-cache invalidation after discovery failure — new regression test passes
- Package integrity (Chrome ZIP + Firefox XPI) — hashes recorded, manifest inspected, contents listed
- Build warnings documented (Browserslist stale, vite-plugin-lib-assets noise)
- Chrome manual runtime on 3 sites (Z.ai, Qwen AI, Gemini) — MCP tool discovery and execution confirmed

## What remains unqualified

- Firefox runtime
- Chrome guided browser protocol (full flow matrix beyond spot-check)
- Real nonzero E2E browser harness (package-contract guard exists only)
- Supported-site adapter contract verification (insertion/submission by host state transition)
- Lifecycle/exactly-once coverage (reconnect, cancellation, duplicate execution prevention)
- Payload budgets (large text, JSON depth, image/base64, streaming buffer)
- Settings/persistence/viewport tests
- Security/privacy review
- Dependency/lint baseline remeasurement
- Legacy SSE and WebSocket transport testing

## Release status

v0.6.1 is published as a pre-release. No code-bearing release has been published since v0.6.1. Modified code in this working tree must not be published as v0.6.1 — the next target is v0.6.2-rc.1 or later.
