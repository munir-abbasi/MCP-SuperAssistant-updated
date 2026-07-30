---
name: troubleshoot-mcp-superassistant
description: Diagnose, reproduce, fix, and verify defects in the srbhptl39/MCP-SuperAssistant browser-extension monorepo and its local MCP proxy across Chrome/Chromium and Firefox. Use for connection-with-zero-tools failures, MCP transport or schema incompatibilities, service-worker and content-script errors, site-adapter breakage, manifest/CSP differences, build or packaging failures, regressions caused by browser or MCP SDK changes, and unresolved upstream issues such as #199.
---

# Troubleshoot MCP SuperAssistant

Work from evidence to the narrowest verified fix. Treat the extension, MCP SDK, transport, proxy, content script, target chat site, and browser as separate failure domains.

## Establish the working state

1. Locate the checkout. Confirm its remote, branch, commit, dirty state, installed dependencies, Node and pnpm versions. Preserve unrelated changes.
2. Read repository instructions and the relevant source before proposing a fix. Do not rely on bundled `dist/background.js` when TypeScript source is available.
3. Record the exact extension version and whether it came from a store, an unpacked build, or a Firefox temporary/add-on package.
4. Record browser name and full version, OS, target chat site, proxy package version, MCP SDK version, endpoint, transport, and server configuration.
5. If an issue or current upstream behavior matters, inspect it through GitHub and distinguish the checked-out commit from upstream `main`. Never infer maintenance status from issue age alone.

Read [repository-map.md](references/repository-map.md) for the known architecture and [browser-debugging.md](references/browser-debugging.md) for browser-specific inspection.

## Reproduce before changing code

Create the smallest deterministic reproduction and state the expected and actual results.

1. Prove the MCP server/proxy independently with MCP Inspector or a protocol-correct request.
2. Capture the raw initialize/capabilities and failing MCP response. Redact tokens, cookies, user data, filesystem contents, and secrets.
3. Test one transport at a time: Streamable HTTP, SSE, or WebSocket. Do not silently change transport while comparing runs.
4. Reproduce in a clean browser profile with only the unpacked extension enabled when interference is plausible.
5. Capture logs from every relevant context:
   - extension background service worker/background page
   - target page console
   - content-script execution
   - Network panel
   - proxy/server stdout and stderr
6. Reload or restart the correct context after rebuilding. A stale service worker or content script invalidates the test.

Use the matrix in [diagnostic-playbook.md](references/diagnostic-playbook.md). Change one variable per comparison and keep a compact evidence table.

## Localize the first failing boundary

Trace data in this order:

1. MCP server response
2. proxy forwarding and CORS
3. MCP SDK parsing/validation
4. transport plugin `getPrimitives`
5. `McpClient` normalization and cache
6. background-to-content messaging/storage
7. sidebar/store rendering
8. site adapter DOM integration

Find the earliest layer whose input is correct and output is wrong. Do not patch downstream symptoms before proving that boundary.

Use controlled differential tests when practical:

- known-good versus failing payload
- one field removed or simplified at a time
- Chrome versus Firefox from the same source commit
- store build versus local build
- current dependency lockfile versus a narrowly selected dependency version
- supported site versus a minimal extension page where applicable

Treat a sanitizer or proxy workaround as localization evidence, not the final fix. Preserve valid protocol fields unless the extension demonstrably does not need them and the compatibility tradeoff is documented.

## Form and falsify hypotheses

For each plausible cause, write:

- evidence supporting it
- evidence against it
- the cheapest discriminating test
- the result that would falsify it

Prioritize direct observations over stack-trace resemblance. Common classes include MCP schema-version drift, SDK/Zod validation, swallowed promise rejections, stale cache, CORS/mixed content, MV3 service-worker lifetime, extension CSP/runtime code generation, Firefox manifest conversion, target-site DOM drift, and stale packaged assets.

For issue #199 or similar zero-tool failures, read [issue-199.md](references/issue-199.md) before editing. Do not assume AJV is the active validator merely because generated validation code resembles AJV.

## Implement the smallest durable fix

1. Add a failing regression test or fixture at the earliest practical boundary.
2. Preserve protocol-valid metadata unless removal is an intentional compatibility layer.
3. Avoid global failure when one primitive is malformed or unsupported. Prefer explicit per-capability/per-item degradation with observable errors when protocol semantics allow it.
4. Do not weaken extension CSP, add `unsafe-eval`, broaden host permissions, or disable validation merely to suppress an error.
5. Keep Chrome and Firefox behavior aligned. Isolate browser-specific code only where APIs or manifests differ.
6. Avoid unrelated refactors, dependency churn, formatting sweeps, or generated bundle edits.
7. Add diagnostic logging only when actionable and non-sensitive; remove noisy temporary logs before handoff.

If the defect is in an upstream SDK, prefer a bounded adapter, pin, or upgrade backed by a regression test. Document why the selected version is compatible; never guess.

## Verify proportionately

Run the repository-defined commands that apply, beginning with the narrowest test and expanding outward:

```bash
pnpm -F chrome-extension test
pnpm -F chrome-extension type-check
pnpm -F chrome-extension lint
pnpm build
pnpm build:firefox
pnpm zip
pnpm zip:firefox
pnpm e2e
pnpm e2e:firefox
```

Check actual scripts before running them; command names may change. Do not claim browser verification from a successful build alone.

For both Chrome and Firefox, verify at minimum:

- extension loads without manifest or background errors
- expected target-site content script loads
- connection state is accurate
- tools are discovered and counted
- instructions are generated
- enable/disable state persists
- one harmless tool call succeeds and its result is inserted/rendered
- reconnect, page reload, and service-worker restart do not regress behavior
- malformed or unsupported data produces a bounded, visible failure

Test all relevant transports when shared discovery code changed. If a browser or end-to-end run is unavailable, state exactly what was not run and provide reproducible manual steps; do not mark it verified.

## Handoff contract

Return:

1. symptom and exact reproduction
2. first failing boundary
3. root cause, separated from contributing factors
4. files changed and why
5. tests added and commands run with results
6. Chrome/Firefox/transport verification matrix
7. remaining uncertainty or risk
8. rollback path
9. upstream issue or PR text when requested

Label facts, inferences, and unresolved hypotheses. Include the decisive logs or payload excerpts without secrets. Do not claim a root cause when only a workaround has been shown.