# MCP SuperAssistant stabilization status

Release candidate: `v0.6.2-rc.1` for `munir-abbasi/MCP-SuperAssistant-updated`.

Stabilization base: upstream snapshot `c26168ee2c5708a3a65ef5afd88cda1a97c81734` (`v0.6.0`).

## Verified in this checkout

### Retained from v0.6.1

- MCP SDK is exactly pinned to `1.25.2`; the former `^1.20.2` range still resolved `1.25.2` and did not perform the stated downgrade.
- Zod protocol parsing is configured before SDK schema creation to use its CSP-safe interpreter path.
- Tool output validation uses `@cfworker/json-schema`, preserving valid `outputSchema` metadata without AJV runtime code generation.
- An unsupported output schema fails its tool call without hiding the valid tool list.
- The issue #199 schema, minimal schemas, draft selection, and mixed valid/invalid tool metadata pass deterministic tests.
- Streamable HTTP tool discovery passes for both JSON and SSE-framed POST responses with the required `Accept` values.
- Chrome and Firefox production background bundles contain no `unsafe-eval`, `eval(`, `new Function`, or `Function(` token.
- Chrome MV3 service-worker and Firefox module-background manifests are generated correctly; Firefox retains strict extension CSP.
- ZIP/XPI creation now waits for the output stream to finish. Both final archives pass `unzip -t`.
- Workspace builds no longer require a network-only `pnpm dlx rimraf` during bundle cleanup.

### New in v0.6.2-rc.1

- **Discovery-state fix**: When `tools/list` fails after connection was established, `McpClient.listTools()` clears the cache, marks the state as `disconnected`, emits a `failure` event via the callback, and rethrows the error. This prevents a stale healthy/zero-tools appearance.
- **Discovery-state regression tests**: Two new tests cover (1) primitive discovery failure while transport health is true, and (2) stale-cache invalidation after forced failure.
- **Qualification documentation suite**: support-matrix.md, baseline-v0.6.1.md, known-limitations.md, package-baseline-v0.6.2-rc.1.md, issue-coverage-ledger.md, manual-browser-protocol.md, and e2e-harness-plan.md.
- **Package-contract E2E guard**: Chrome and Firefox mode both run 2 tests that verify browser target, manifest shape, core file presence, and archive integrity — preventing the previous zero-test-passing CI pipeline.
- **Manual Chrome runtime evidence**: Extension loaded successfully in ungoogled-chromium; filesystem MCP server discovered and executed tool calls on Z.ai, Qwen AI, and gemini.google.com. This is the first positive browser runtime evidence after the earlier CDP registration failure.

## Commands and results

| Gate | Result |
| --- | --- |
| `pnpm -F chrome-extension test` | PASS, 7 tests |
| `pnpm -F chrome-extension type-check` | PASS |
| Targeted ESLint for new source/tests | PASS |
| `pnpm build` | PASS |
| `pnpm build:firefox` | PASS |
| Chrome ZIP integrity and manifest | PASS |
| Firefox XPI integrity, manifest and CSP | PASS |
| Packaged background/content runtime-generation scan | PASS |
| Repository-wide `pnpm -F chrome-extension lint` | Baseline failure: 704 pre-existing errors across untouched files |
| `pnpm e2e` | PASS, package-contract guard ran 2 tests and selected Chrome mode |
| `pnpm e2e:firefox` | PASS, package-contract guard ran 2 tests and selected Firefox mode |
| Real Chrome smoke matrix | **Manual PASS**: extension loaded in ungoogled-chromium; filesystem MCP server discovered and executed tool calls on Z.ai, Qwen AI, and gemini.google.com. |
| Real Firefox smoke matrix | NOT RUN |

Build warnings from `vite-plugin-lib-assets` about TypeScript imports with `.js` specifiers remain upstream noise; Vite resolves and bundles the modules and both builds complete.

Chrome runtime is now manually qualified at a basic level. The next discriminator for stable release is a guided browser protocol covering the full flow matrix, followed by Firefox qualification on the same candidate commit.

## Issue-family coverage

| Issues | Current disposition |
| --- | --- |
| #199, #196, #191, #176, #171, #158, #87, #12 | #199 root cause fixed and fixture-covered. Discovery-state failure fix in v0.6.2-rc.1 covers additional failure paths. The other distinct reports still require their own payloads/reproductions. |
| #200, #189, #73 | JSON and SSE-framed Streamable HTTP client responses are contract-tested. Proxy-side empty bodies in #189 are outside this extension checkout and remain unverified. |
| #194, #184, #183, #155, #112, #80, #64 | Deferred: reconnect, cancellation, concurrency and soak tests require proxy/browser harnesses. |
| #160, #157, #126, #120, #89, #86, #82, #62 | Deferred: server/config compatibility matrix not reproduced. |
| #201, #195, #193, #172, #162 | Deferred: real-site controlled-editor insertion and submit verification required. |
| #192, #174, #167, #154, #94, #91, #37 | Deferred: parser streaming and exactly-once browser fixtures required. |
| #190, #150, #92 | Deferred: real SPA/hydration/update lifecycle tests required. |
| #169, #148, #111, #105, #93 | Deferred: site-specific live DOM evidence required. |
| #166, #151, #149, #54 | Deferred: payload budgets, binary handling and large-result browser tests required. |
| #186, #90 | Deferred: settings and viewport interaction tests required. |
| #175, #136, #55 | Deferred: controlled host-integrity comparisons required. |
| #109, #107, #127, #33 | Built-bundle runtime-generation scan passes; broader message-origin, permissions, secret and injection review remains. |
| #182, #129 | Feature work deferred pending profile/context acceptance criteria. |
| #164 | Media feature deferred pending safe transfer design. |
| #187, #181, #146, #138, #134, #75, #74, #42, #6 | New-site feature backlog; not part of the verified support matrix. |
| #123, #85, #65, #49, #16, #14, #13 | Product/proxy expansion and support work deferred. |

## Remaining release gates for v0.6.2

The following must be completed before promoting v0.6.2-rc.1 to a full v0.6.2 stable release:

1. **Firefox runtime qualification**: Load the v0.6.2-rc.1 XPI as temporary add-on, check `about:debugging` for background errors, visit one chat site.
2. **Guided browser protocol**: Execute `docs/qualification/manual-browser-protocol.md` on Chrome covering all release gates (connect/discover/execute, manual and auto-execute dispatch, reload, SPA navigation, worker restart, reconnect, large payloads).
3. **Site adapter contracts**: Verified insert/submit behavior on at least one non-ProseMirror declared site.
4. **Lifecycle/exactly-once coverage**: Reconnect, cancellation, duplicate execution prevention.
5. **Legacy SSE and WebSocket transport**: At least basic discovery/execution verification.
