# MCP SuperAssistant stabilization status

Release candidate: `v0.6.1` for `munir-abbasi/MCP-SuperAssistant-updated`.

Stabilization base: upstream snapshot `c26168ee2c5708a3a65ef5afd88cda1a97c81734` (`v0.6.0`).

## Verified in this checkout

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

## Commands and results

| Gate | Result |
| --- | --- |
| `pnpm -F chrome-extension test` | PASS, 5 tests |
| `pnpm -F chrome-extension type-check` | PASS |
| Targeted ESLint for new source/tests | PASS |
| `pnpm build` | PASS |
| `pnpm build:firefox` | PASS |
| Chrome ZIP integrity and manifest | PASS |
| Firefox XPI integrity, manifest and CSP | PASS |
| Packaged background/content runtime-generation scan | PASS |
| Repository-wide `pnpm -F chrome-extension lint` | Baseline failure: 704 pre-existing errors across untouched files |
| `turbo e2e` | No tasks exist; zero tests executed |
| Real Chrome/Firefox smoke matrix | NOT RUN: no browser executable in the environment |

Build warnings from `vite-plugin-lib-assets` about TypeScript imports with `.js` specifiers remain upstream noise; Vite resolves and bundles the modules and both builds complete.

## Issue-family coverage

| Issues | Current disposition |
| --- | --- |
| #199, #196, #191, #176, #171, #158, #87, #12 | #199 root cause fixed and fixture-covered. The other distinct reports still require their own payloads/reproductions. |
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

## Required real-browser release gate

Use the packaged artifact from this exact tree, disable the store copy, and record browser version and OS.

For Chrome and Firefox separately:

1. Load the Chrome ZIP unpacked or the Firefox XPI/temporary add-on and confirm no manifest/background errors.
2. On ChatGPT and one non-ProseMirror declared site, connect to the same fixture proxy over Streamable HTTP and legacy SSE; test WebSocket only if it remains advertised.
3. Verify connection truthfulness, tool count, instructions, enable-state persistence, one harmless call, structured failure insertion, reload, SPA navigation, worker/background restart and reconnect.
4. Verify manual Run and auto-execute dispatch exactly once; confirm insertion and auto-submit by observed host state transition.
5. Repeat after network interruption and proxy restart, then run rapid reconnect and multi-session soak checks.
6. Test large text and image results against explicit budgets and confirm no tab freeze or base64 DOM flood.

Until this matrix passes, `v0.6.1` is published as a pre-release rather than represented as a fully browser-qualified stable release.
