# Open issue map

Snapshot: 78 open issues in `srbhptl39/MCP-SuperAssistant`, inspected 2026-07-15. Refresh the live repository before relying on state or counts. Issue bodies contain reporter claims, not established root causes.

## Priority model

Use this default order:

1. security/privacy, data corruption, duplicate side effects, crashes, freezes, and unbounded resource growth;
2. connection, discovery, tool execution, result delivery, and reconnect reliability;
3. Chrome/Firefox parity and packaged-artifact validity;
4. supported-site adapter regressions and accessibility/UX blockers;
5. compatibility improvements;
6. new sites, new products, and convenience features.

## Failure-family ledger

| Family | Issues | Required coverage |
| --- | --- | --- |
| Tool discovery, SDK/schema and MV3 CSP | #199, #196, #191, #176, #171, #158, #87, #12 | Exact `tools/list` fixtures; valid/invalid `inputSchema` and `outputSchema`; no runtime code generation; bounded per-item failure; honest connection state |
| Streamable HTTP/SSE response framing | #200, #189, #73 | JSON and `text/event-stream` POST responses; chunk boundaries; multiple events; empty/invalid body; session and protocol headers |
| Transport reconnect and proxy lifecycle | #194, #184, #183, #155, #112, #80, #64 | idempotent connect/close; rapid reconnect; stale-session cleanup; timeout/cancellation semantics; no duplicate calls; concurrency and soak tests |
| MCP/config/server compatibility | #160, #157, #126, #120, #89, #86, #82, #62 | Config dialect normalization; protocol negotiation; error attribution; downstream-server fixtures; do not mislabel configuration failures as extension bugs |
| Text insertion and auto-submit | #201, #195, #193, #172, #162 | Shared adapter contract; controlled-editor state; selector fallback; verify insertion/submission outcome; ChatGPT, Grok, DeepSeek and every declared supported site |
| Function-call recognition, Run and auto-execute | #192, #174, #167, #154, #94, #91, #37 | Incremental JSONL/XML framing; embedded fences/backticks; localized labels; streaming completion; Run visibility; exactly-once execution |
| Sidebar, hydration and extension lifecycle | #190, #150, #92 | Defer host DOM mutation safely; reattach without flap; SPA navigation; extension update/context invalidation; no React hydration damage |
| Site-specific adapter drift | #169, #148, #111, #105, #93 | Site/version evidence; activation, selectors, insertion, submit, parsing and result insertion in Chrome and Firefox where supported |
| Results, errors and large/binary payloads | #166, #151, #149, #54 | Data-model copying; string type preservation; structured errors returned to model; image/blob limits; truncation/attachment policy; no base64 DOM flood |
| UI/settings | #186, #90 | Editable endpoint and transport; validation; scroll/keyboard access; viewport/responsive tests |
| Host-platform integrity and user control | #175, #136, #55 | Do not overwrite native tool semantics or prompt DOM; preserve edit/fork controls; measure before attributing model changes to extension |
| Security and privacy | #109, #107, #127, #33 | Minimize host permissions; validate message origins/targets; secret storage and redaction; optional auth headers without leaks; review bundled production artifact |
| Tool/context management | #182, #129 | Selective exposure and profiles without stale state, instruction drift, or hidden tools; context-size tests |
| Media workflow | #164 | Treat as feature work; define safe binary transfer/upload boundaries and permissions before implementation |
| New site/platform support | #187, #181, #146, #138, #134, #75, #74, #42, #6 | Feature backlog; require adapter contract and maintenance owner before declaring support |
| Product/proxy expansion and support questions | #123, #85, #65, #49, #16, #14, #13 | Separate product decisions/documentation from stabilization; security review for API bridging, Docker, auth, or cross-service automation |

## Duplicate-looking reports that must remain distinguishable

- “Connected, zero tools” can arise from schema/CSP failure (#171/#196/#199), response framing (#189/#200), proxy/config failure (#12/#73/#86/#89), or protocol/dependency incompatibility (#158/#160). Do not apply one workaround to all.
- “No Run button” can arise from parser framing (#37/#91/#94/#167), incomplete streaming state, DOM renderer lifecycle (#192), or model output that does not satisfy the extension contract (#154/#174).
- “Does not auto-submit” can be controlled-editor insertion failure, stale selectors, disabled button state, false-positive `.click()` success, or platform policy. Verify the editor became non-empty and then became empty/submitted.
- SSE reconnect crashes (#183/#184/#194) and long-call timeout loops (#155) share lifecycle concerns but need separate concurrency and cancellation tests.

## Claims requiring special skepticism

- Synthetic `KeyboardEvent` or `.click()` events cannot become trusted user events. A patch that relies on `isTrusted` becoming true is invalid by construction.
- `document.execCommand()` may help some controlled editors but is deprecated and must not be the only insertion strategy.
- A fixed hydration delay may hide a race without proving readiness. Prefer observable readiness, idempotent mounting, and mutation isolation; retain a bounded fallback only if measured.
- Exposed Firebase web configuration is not automatically a secret. Assess Firebase rules, authorized domains, data access and abuse controls before calling it credential leakage.
- A third-party security scanner finding is a lead, not a confirmed vulnerability. Reproduce exploitability against source and the packaged artifact.
- Reports about host-selected model quality (#175) or native platform tools (#55) require controlled before/after evidence; injected instructions can influence model behavior without technically disabling platform capabilities.

## Coverage ledger template

| Issue | Class | Family | Reproduced | Component | Test/fixture | Disposition | Evidence gap |
| --- | --- | --- | --- | --- | --- | --- | --- |

Use one row per issue, including duplicates and deferred requests. Never use “covered by cluster” without naming the test that covers its distinctive symptom.
