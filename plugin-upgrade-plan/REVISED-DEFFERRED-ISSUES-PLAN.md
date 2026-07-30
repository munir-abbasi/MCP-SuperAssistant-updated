# MCP SuperAssistant deferred-issues implementation plan

Generated: 2026-07-16  
Target repository: `munir-abbasi/MCP-SuperAssistant-updated`  
Default branch inspected: `main`  
Main head inspected: `6abee1dfc1bdb7287c450e1b5794369b4e93e02f`  
Stabilization commit: `7449684d589b5b99088b0b84e86a465e8fd6acca`  
Upstream issue source: `srbhptl39/MCP-SuperAssistant`

## Decision

Treat the deferred work as a release-qualification and reliability program, not as one large bugfix and not as an obligation to implement every upstream request.

The first code-bearing priority is truthful connection and discovery state. The current Streamable HTTP implementation can catch a failed `listTools()` call, return an empty primitive list, and still report connected because a transport object exists. That means failure modes other than the fixed issue #199 schema case can still appear as “connected, zero tools.”

Do not modify and republish `v0.6.1` under the same version after code changes. Use `v0.6.2-rc.1` for the first code-bearing qualification release. The existing `v0.6.1` artifact may only be promoted unchanged if the complete qualification matrix passes without requiring code changes.

## Verified repository state

The following facts were verified from the target repository on 2026-07-16:

- The repository is public, uses `main`, and reports package version `0.6.1`.
- The fork currently has no fork-local issues or pull requests. The deferred issue IDs therefore refer to the upstream tracker unless explicitly re-created in the fork.
- `chrome-extension/package.json` pins `@modelcontextprotocol/sdk` exactly to `1.25.2` and uses `@cfworker/json-schema` `^4.1.1` and Zod `^4.3.5`.
- The extension has five deterministic tests: three JSON Schema/CSP tests and two Streamable HTTP framing tests.
- Root `pnpm e2e` and `pnpm e2e:firefox` build packages and invoke `turbo e2e`, but no workspace package defines an `e2e` script. The current E2E workflow therefore executes no browser tests.
- `STABILIZATION_STATUS.md` records passing targeted tests, type-check, Chrome/Firefox builds, bundle scans, and archive integrity checks; it also records 704 pre-existing lint errors and no real-browser smoke run.
- The manifest declares content scripts for ChatGPT, Perplexity, Grok/X, Gemini, AI Studio, OpenRouter, DeepSeek, Kagi, T3 Chat, Mistral, GitHub Copilot, Kimi, Z Chat, and Qwen. This is an advertised surface, not a verified support matrix.
- Streamable HTTP discovery catches capability-list failures independently and returns the remaining primitives. An all-tools discovery failure can therefore be hidden as zero tools.
- Streamable HTTP health currently equates transport-object existence with health. It does not prove initialization, discovery, or request success.
- SSE and WebSocket discovery propagate errors differently from Streamable HTTP. Shared semantics are not yet enforced.

Repository documentation says `v0.6.1` is a prerelease. Confirm the actual GitHub release metadata and artifact hashes at implementation start because release metadata was not exposed by the repository inspection used for this plan.

## Evidence labels

Use these labels in the ledger and in implementation reports:

| Label | Meaning |
| --- | --- |
| Verified | Reproduced or directly observed against a recorded commit/artifact |
| Claimed | Stated in an issue, changelog, or status document but not independently rerun |
| Inferred | Supported by source inspection but not yet reproduced at runtime |
| Unknown | Missing payload, environment, reporter confirmation, or executable evidence |

Do not convert “claimed” or “inferred” to “verified” merely because a build passes.

## Scope and release policy

### Release-blocking scope

The following are blockers when they occur inside the declared support matrix:

1. false connected/healthy state after failed initialization or tool discovery;
2. duplicate or ambiguous tool execution;
3. reconnect crashes, leaked sessions, or unbounded retry loops;
4. valid MCP schemas failing because of extension CSP or runtime code generation;
5. supported-site insertion or submission not recognized by the host editor;
6. large results freezing a tab or flooding the DOM with base64;
7. Chrome/Firefox package, manifest, CSP, or runtime failure;
8. a reproducible High/Critical security or privacy defect;
9. missing E2E execution disguised as a green CI job.

### Non-blocking by default

These do not block the next stabilization release unless they are regressions in an explicitly supported feature:

- new chat platforms;
- media upload and cross-service automation;
- profiles and advanced context management;
- Docker or product/proxy expansion;
- broad lint-debt cleanup;
- speculative dependency upgrades;
- support questions and unreproducible historical reports.

### Declared support matrix

Before implementation, publish a temporary matrix with one status per dimension:

| Dimension | Required status values |
| --- | --- |
| Browser | Qualified, experimental, unsupported |
| Platform/site | Qualified, smoke-only, experimental, unsupported |
| Transport | Qualified, experimental, unsupported |
| MCP protocol version | Tested, compatible-by-inference, unsupported |
| Artifact | Development-only, packaged, signed/store-distributed |
| OS | Tested, smoke-only, untested |

Recommended minimum release matrix:

- current stable Chrome and Firefox on Linux;
- Chrome or Firefox on one additional desktop OS if available;
- ChatGPT plus one non-ProseMirror site;
- Streamable HTTP with JSON and SSE-framed POST responses;
- legacy SSE only if retained in product settings/documentation;
- WebSocket only if retained as advertised support;
- exact packaged Chrome and Firefox artifacts built from the candidate SHA.

Every other site currently named in the README or manifest must be marked experimental or unsupported until it passes the adapter contract. Historical support is not current evidence.

## Tracking artifacts to add

Create these repository-owned artifacts in the first documentation/infrastructure PR:

```text
docs/qualification/support-matrix.md
docs/qualification/issue-coverage-ledger.md
docs/qualification/manual-browser-protocol.md
docs/qualification/known-limitations.md
artifacts/qualification/.gitkeep
```

The coverage ledger requires one row per upstream issue:

| Issue | Classification | Failure family | Reproduced | First failing boundary | Test/fixture | Disposition | Release blocker | Evidence gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Never mark an issue “covered by cluster” without naming the test that covers its distinctive acceptance criterion. A shared root cause does not prove every report resolved.

Because the fork has no issues, create one fork-local tracking issue after this plan is accepted. Link the ledger rather than copying 78 upstream issues into the fork. Create separate fork issues only for confirmed defects or bounded work packages.

## Work package 0: freeze the reproducible baseline

### Implementation

1. Record main SHA, tag/release SHA, working-tree status, Node version, pnpm version, lockfile hash, OS, browser versions, proxy version, and MCP protocol version.
2. Download or rebuild the `v0.6.1` Chrome and Firefox artifacts. Record SHA-256 hashes.
3. Confirm whether the GitHub release is prerelease, draft, latest, or stable.
4. Run the repository-documented baseline commands without changing dependencies.
5. Record all commands and results in `docs/qualification/baseline-v0.6.1.md`.
6. Refresh the upstream issue list. Classify each issue as confirmed defect, plausible defect needing reproduction, duplicate symptom, configuration/upstream problem, feature request, support question, or stale/obsolete.

### Acceptance gate

- Every later result can be tied to a commit and artifact hash.
- Current failures are recorded rather than normalized away.
- No upstream issue is represented as fixed solely because issue #199 is fixed.
- The support matrix explicitly says what the next release does and does not claim to support.

## Work package 1: make connection and discovery state truthful

Issue families: `#199,#196,#191,#176,#171,#158,#87,#12`, plus framing/config variants in `#200,#189,#73,#160,#157,#126,#120,#89,#86,#82,#62`.

### First failing boundary to test

```text
MCP response -> SDK parsing -> transport getPrimitives -> McpClient state -> sidebar status
```

### Implementation

1. Introduce an explicit state model, for example:

```text
disconnected
connecting
connected-uninitialized
discovering
ready
degraded
error
```

2. Define “ready” as successful initialization plus completion of the required discovery operation. Transport-object existence is insufficient.
3. Replace silent Streamable HTTP catches with typed per-capability outcomes. Preserve partial success, but expose failed tools/resources/prompts discovery separately.
4. If tools are advertised but `listTools()` fails, do not display a healthy connected/zero-tools state.
5. Align Streamable HTTP, SSE, and WebSocket error semantics through a shared discovery result type rather than three unrelated catch policies.
6. Keep per-item schema containment from `v0.6.1`; do not strip valid `outputSchema` metadata.
7. Add a user-visible, actionable error containing transport, failed capability, and retry guidance without secrets or raw payloads.

### Required tests

- server advertises tools and returns zero valid tools;
- server advertises tools and `tools/list` fails;
- server does not advertise tools;
- tools succeed while prompts fail;
- one tool contains unsupported schema metadata;
- exact issue #199 schema;
- empty body, invalid content type, JSON-RPC error, and malformed response;
- stale cached tools followed by discovery failure;
- reconnect after a previous ready state.

### Acceptance gate

- UI status distinguishes “no tools advertised,” “zero tools returned,” and “tool discovery failed.”
- No transport can report ready solely because a transport object exists.
- Partial capability failure is visible and does not erase successful capabilities.
- Old issue #199 fixtures still pass under strict CSP.
- Tests fail against the old silent-zero-tools behavior and pass after the change.

## Work package 2: build a deterministic fixture MCP service

### Implementation

Add a test-only fixture service, preferably under `packages/test-mcp-fixture`, that supports scenario selection without modifying production proxy code.

Required scenarios:

- Streamable HTTP JSON response;
- Streamable HTTP SSE-framed response;
- fragmented SSE chunks and multiple events;
- legacy SSE if supported;
- WebSocket if supported;
- empty response and invalid content type;
- slow initialization and slow tool call;
- proxy restart and stale session;
- cancellation;
- concurrent tool calls with distinct correlation IDs;
- valid, invalid, and mixed tool schemas;
- deterministic read-only call;
- deterministic structured error;
- large text, structured JSON, and image/base64 result;
- deliberately incomplete or malformed JSON-RPC.

The fixture must emit sanitized structured logs containing scenario, session ID, request ID, method, timestamps, cancellation, and close reason. It must never record authorization headers or user tool arguments by default.

### Acceptance gate

- Scenarios are deterministic and runnable without an external MCP server.
- Each scenario has a direct protocol-level assertion independent of the extension.
- The same fixture configuration is usable by Chrome and Firefox tests.
- Proxy/server faults are distinguishable from extension faults.

## Work package 3: replace the no-op E2E workflow

### Automation design

Do not assume one browser runner can load both extensions identically.

- Chrome: use a persistent Chromium context with the extracted candidate extension directory loaded through extension flags. Test the files extracted from the final ZIP, not a separately rebuilt development directory.
- Firefox: select and document one supported route before implementation. Preferred options are `web-ext run` plus WebDriver BiDi/Marionette, or a dedicated Firefox add-on harness. If reliable automation is unavailable, keep Firefox as a mandatory, evidence-recorded manual gate rather than claiming CI coverage.
- Authenticated live chat sites: do not depend on them for deterministic CI. Use stable DOM adapter fixtures for automated contract tests and run a controlled live-site smoke separately.

### Scripts

Add real package-level scripts and make zero executed tests fatal:

```text
e2e:contract
e2e:chrome
e2e:firefox
e2e
```

The root scripts must invoke actual workspace tasks. Add an assertion that the result count is greater than zero so Turbo cannot silently succeed with no task.

### Artifact evidence

Store CI artifacts by candidate SHA and browser:

```text
artifacts/qualification/<sha>/<browser>/
  environment.json
  artifact-sha256.txt
  browser-console.log
  background-console.log
  fixture-proxy.log
  results.json
  screenshots/
  traces/
```

### Acceptance gate

- `pnpm e2e` fails if no browser/contract tests run.
- Chrome loads the extension extracted from the final ZIP.
- Firefox evidence states whether the XPI is temporary, unsigned, signed, or store-installed.
- Manifest/background load errors fail the run.
- The run records commit, artifact hash, browser version, OS, site fixture version, transport, and scenario.
- CI and documentation do not call Firefox “automated” if it was manually verified.

## Work package 4: reconnect, cancellation, and exactly-once execution

Issue families: `#194,#184,#183,#155,#112,#80,#64,#192,#174,#167,#154,#94,#91,#37`.

### Implementation

1. Model connect/close/reconnect as an idempotent state machine.
2. Ensure concurrent `connect()` calls share or reject against one in-flight transition.
3. Close and clear the old client/transport before replacement.
4. Bind every tool call to a unique request ID and one terminal outcome.
5. Define cancellation semantics at UI, client, transport, and fixture boundaries.
6. Bound retries by count and elapsed time; add jitter where repeated clients could synchronize.
7. Prevent stale completion handlers from inserting results after disconnect or reconnect.
8. Instrument dispatch counts in tests without shipping noisy or sensitive production logging.

### Required tests

- concurrent connect;
- rapid disconnect/reconnect;
- proxy restart during discovery;
- proxy restart during tool call;
- service-worker/background restart;
- timeout followed by late server response;
- cancel before dispatch, during transport, and after completion;
- multiple tabs and multiple browser sessions;
- repeated streaming parser updates;
- exactly one manual Run and at most one auto-execution;
- no duplicate result insertion after retry or reconnect.

### Acceptance gate

- No “already connected” crash.
- No call executes more than once without an explicit user retry.
- Late responses cannot mutate a newer session.
- Listener, timer, observer, and session counts return to baseline after teardown.
- A 30-minute soak and at least 100 connect/disconnect cycles complete without unbounded growth.

## Work package 5: adapter contract, insertion, and submission

Issue families: `#201,#195,#193,#172,#162,#190,#150,#92,#169,#148,#111,#105,#93,#175,#136,#55`.

### Shared adapter contract

Every qualified site must:

1. activate only on intended origins and routes;
2. mount once without damaging host hydration or native controls;
3. survive SPA navigation and remount idempotently;
4. locate the active editor using semantic selectors and observable fallbacks;
5. insert plain text, multiline JSON, XML, and fenced code;
6. prove the host application recognized the inserted content;
7. submit and prove the host state transition rather than assuming `.click()` succeeded;
8. recognize complete streaming tool calls and ignore incomplete/ordinary code blocks;
9. show Run once and auto-execute at most once;
10. insert structured results and errors without freezing;
11. preserve native edit, fork, upload, tools, and keyboard behavior;
12. remove observers, listeners, timers, and injected nodes on teardown.

### Implementation strategy

- Build deterministic DOM fixtures for ProseMirror/contenteditable, controlled textarea/input, and one non-ProseMirror editor.
- Keep site selectors and insertion behavior in per-site modules.
- Add a `last_verified` date and site version/DOM fingerprint to each qualified adapter record.
- Prefer observable readiness and idempotent mounting over fixed hydration delays.
- Do not rely on synthetic events becoming trusted or on `document.execCommand()` as the only insertion path.
- If a site cannot pass the contract, downgrade it in README/support metadata instead of claiming support.

### Acceptance gate

- Automated adapter fixtures pass for each qualified editor class.
- Live smoke passes on ChatGPT and one non-ProseMirror qualified site in both browsers.
- Submission is proven by editor/request/conversation state transition.
- Native host controls remain functional in before/after checks.
- Unsupported or unverified sites are no longer advertised as qualified.

## Work package 6: payload budgets and result safety

Issue families: `#166,#151,#149,#54`.

### Implementation

Define measured budgets before choosing constants:

- maximum inline text size;
- maximum structured JSON render size and depth;
- maximum image/base64 size;
- maximum result-to-instruction size;
- streaming buffer ceiling;
- render time and long-task threshold;
- truncation and attachment/download behavior.

Use bounded previews for oversized results. Do not inject megabytes of base64 into chat DOM. Preserve exact string values that happen to contain JSON, XML, or code.

### Required tests

- near-limit and over-limit text;
- deeply nested and broad JSON;
- base64 image and unsupported binary-like content;
- repeated large calls;
- slow/chunked result;
- structured error at the size limit;
- copy and insertion type preservation.

### Acceptance gate

- Oversized behavior is deterministic, visible, and documented.
- No unbounded DOM/base64 insertion.
- Browser remains responsive at and above the boundary.
- Truncation cannot silently change a tool result into misleading content.

## Work package 7: settings, persistence, and viewport

Issue families: `#186,#90,#182,#129` where the latter two remain feature work unless existing behavior regressed.

### Required tests

- server URL and transport validation;
- enable/disable persistence;
- tool selection and instruction persistence;
- migration from `v0.6.0` and `v0.6.1` state;
- invalid/corrupt stored values;
- narrow and wide viewport;
- keyboard-only access and scrolling;
- sidebar resize and route change;
- multiple tabs with a defined synchronization policy;
- extension update/context invalidation.

### Acceptance gate

- Persistence behavior is documented and deterministic.
- Corrupt state recovers without silently losing unrelated settings.
- All controls remain reachable at supported viewports and by keyboard.
- Profiles/context enhancements remain separate until acceptance criteria exist.

## Work package 8: security, privacy, and permissions

Issue families: `#109,#107,#127,#33`.

### Review areas

- content-script/background message origin, sender, and schema validation;
- host-permission necessity per advertised site;
- `web_accessible_resources` exposure;
- proxy URL scheme, localhost/private-network assumptions, and mixed content;
- authorization header and bearer-token storage;
- log and artifact redaction;
- untrusted tool metadata, arguments, results, HTML, Markdown, and URLs;
- Trusted Types and DOM injection boundaries;
- remote configuration and analytics endpoints;
- source-versus-bundle dependency and license inventory;
- absence of `eval`, `new Function`, and other runtime code generation in packaged paths.

### Acceptance gate

- Findings are ranked Critical, High, Medium, Low, or Informational with reproducible evidence.
- Every Critical/High finding is fixed or blocks release.
- Permissions are least-privilege or justified per origin.
- Secrets, prompts, arguments, and results are redacted from normal logs and test artifacts.
- Chrome and Firefox final bundles retain strict CSP.

## Work package 9: packaged-artifact and upgrade qualification

### Required matrix

For Chrome and Firefox:

- clean install;
- upgrade from the last published artifact;
- manifest, icons, permissions, CSP, and background context;
- storage migration;
- connect, discover, enable, instruction generation, call, result insertion, and error rendering;
- manual Run, auto-execute, and auto-submit;
- reload, SPA navigation, background restart, network interruption, and proxy restart;
- narrow viewport and locale variation;
- final archive integrity and SHA-256.

For Chrome, extract and load the exact ZIP. For Firefox, distinguish temporary installation of an unsigned XPI from validation of a signed/store artifact. Do not infer store-installability from `unzip -t` or a temporary add-on load.

### Acceptance gate

- Evidence is tied to one candidate SHA and artifact hashes.
- Clean install and upgrade both pass.
- No stale source build is substituted for the packaged artifact.
- Chrome success cannot compensate for missing Firefox evidence.

## Work package 10: dependency upgrades and lint debt

### SDK/dependency lane

Keep SDK upgrades isolated from functional fixes. For each proposed version:

1. run the pinned `1.25.2` baseline;
2. change one dependency set only;
3. run schema/CSP and transport contract tests;
4. build and scan both packaged artifacts;
5. run the real-browser core matrix;
6. compare bundle composition and runtime behavior;
7. merge only with explicit before/after evidence.

Any upgrade that reintroduces runtime code generation, schema loss, or discovery regression is rejected or bounded behind a documented adapter/pin.

### Lint lane

The 704-error count is a recorded baseline claim and must be remeasured at the implementation SHA. Do not mix repository-wide lint cleanup with qualification fixes.

- changed files must pass targeted lint;
- CI must prevent new lint debt in changed files;
- baseline cleanup should be directory-scoped, behavior-neutral PRs;
- formatting sweeps must not obscure functional diffs.

## Issue-family disposition

| Family | Upstream issues | Implementation disposition |
| --- | --- | --- |
| Schema/discovery/CSP | `#199,#196,#191,#176,#171,#158,#87,#12` | Revalidate #199; implement truthful discovery; reproduce distinct reports |
| Streamable HTTP/SSE framing | `#200,#189,#73` | Expand fixture framing and proxy error cases |
| Reconnect/proxy lifecycle | `#194,#184,#183,#155,#112,#80,#64` | State machine, cancellation, concurrency, soak |
| MCP/config compatibility | `#160,#157,#126,#120,#89,#86,#82,#62` | Normalize configuration only after controlled reproductions |
| Insertion/submit | `#201,#195,#193,#172,#162` | Shared adapter contract plus live state-transition proof |
| Parser/Run/auto-execute | `#192,#174,#167,#154,#94,#91,#37` | Incremental fixtures and exactly-once dispatch |
| SPA/hydration lifecycle | `#190,#150,#92` | Idempotent mount/remount and teardown tests |
| Site-specific drift | `#169,#148,#111,#105,#93` | Qualify or downgrade each site individually |
| Results/large payloads | `#166,#151,#149,#54` | Explicit budgets and safe oversized-result UX |
| UI/settings | `#186,#90` | Persistence, validation, viewport, keyboard |
| Host integrity | `#175,#136,#55` | Controlled before/after evidence |
| Security/privacy | `#109,#107,#127,#33` | Reproduce scanner claims; permission/message/output review |
| Profiles/context | `#182,#129` | Needs design; non-blocking by default |
| Media | `#164` | Needs safe transfer design; non-blocking |
| New sites | `#187,#181,#146,#138,#134,#75,#74,#42,#6` | Product backlog; adapter owner and contract required |
| Product/proxy expansion | `#123,#85,#65,#49,#16,#14,#13` | Separate roadmap/support lane |

## PR sequence

Keep PRs reversible and independently verifiable:

1. `docs: define qualification matrix and issue ledger`
2. `test: add deterministic MCP fixture service`
3. `fix: make discovery and connection state truthful`
4. `test: add real Chrome E2E and zero-test guard`
5. `test: add Firefox qualification harness or documented manual gate`
6. `fix: make reconnect and tool dispatch exactly once`
7. `test/fix: establish adapter contract and qualify core sites`
8. `fix: enforce payload budgets and safe result rendering`
9. `security: minimize permissions and harden message/output boundaries`
10. `release: qualify v0.6.2-rc.1 artifacts`

Unit or contract regressions may be fixed before the full browser harness exists when the first failing boundary is deterministic. Do not postpone a proven critical fix merely to preserve PR order. Still require the complete browser gate before release promotion.

## CI gate design

Required checks for code-bearing PRs:

```text
targeted unit/contract tests
type-check
changed-file lint
Chrome build and archive integrity
Firefox build and archive integrity
manifest/CSP/runtime-codegen scans
Chrome E2E core matrix
Firefox automated core matrix or explicitly named manual release gate
zero-test assertion
```

Nightly or scheduled checks:

```text
reconnect/soak
large-payload performance
live-site smoke
dependency candidate matrix
permission/bundle inventory
```

Do not make authenticated live-site automation a required PR check if it is brittle, violates platform controls, or depends on personal sessions. Keep deterministic adapter fixtures in CI and collect controlled live evidence before release.

## Release promotion gate

Promote a candidate only when all applicable conditions are true:

- candidate SHA and artifact hashes are recorded;
- root E2E scripts run nonzero tests;
- Chrome packaged artifact passes the declared matrix;
- Firefox packaged artifact passes the declared matrix;
- connection/discovery state is truthful for success, empty, partial, and failure cases;
- JSON and SSE-framed Streamable HTTP paths pass in-browser;
- retained SSE/WebSocket support passes or is downgraded in documentation/UI;
- reconnect, interruption, restart, cancellation, and exactly-once tests pass;
- supported-site insertion and submit are proven by host state transitions;
- payload budgets prevent freezes and base64 DOM flooding;
- upgrade and persisted-state tests pass;
- no unresolved reproducible Critical/High security finding remains;
- support matrix, known limitations, coverage ledger, changelog, rollback notes, and reproducible build instructions are current.

If any release-blocking gate fails, keep the candidate as prerelease, publish the known-failure matrix, and create a bounded follow-up issue. Do not weaken the matrix after seeing failures without explicitly reducing advertised support.

## Rollback

For each code-bearing PR:

- retain the last known-good candidate artifacts and SHA-256 hashes;
- document storage/data migrations and whether downgrade is safe;
- keep SDK changes isolated so the exact pin can be restored;
- use feature flags only for bounded risk, not to conceal broken default behavior;
- provide a one-commit revert path where practical;
- never roll back by weakening CSP, enabling `unsafe-eval`, disabling validation globally, or stripping protocol-valid schema metadata.

## Definition of done

The deferred program is complete for a release when:

1. the declared support matrix passes from final packaged artifacts;
2. every upstream issue in scope has a ledger row and evidence-based disposition;
3. release blockers are closed by reproductions and tests, not by similarity to another issue;
4. unsupported features/sites are labeled honestly;
5. test and browser evidence is tied to commit and artifact hashes;
6. remaining feature requests and unreproducible reports are explicitly deferred with evidence gaps;
7. documentation and rollback instructions match the shipped artifact.

## Immediate next action

Start with one combined baseline/truthfulness tranche:

1. create `docs/qualification/support-matrix.md` and `issue-coverage-ledger.md`;
2. add failing tests for advertised-tools discovery failure and stale-cache-after-failure;
3. change Streamable HTTP discovery/state handling so the UI cannot show healthy connected/zero-tools after `listTools()` fails;
4. preserve the existing issue #199 and JSON/SSE framing tests;
5. package both browsers and record hashes;
6. then add the real E2E harness against the deterministic fixture service.

This sequence attacks the remaining misleading core state immediately while building the evidence system needed for the rest of the backlog.
