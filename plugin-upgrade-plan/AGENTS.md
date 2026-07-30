# AGENTS.md

# Project: MCP SuperAssistant stabilization and upgrade

## 1. Authority

This file is the primary repository-level operating instruction for AI coding agents working on `munir-abbasi/MCP-SuperAssistant-updated`.

Apply instructions in this order:

1. the user's explicit current instruction;
2. this `AGENTS.md`;
3. `DEFERRED_ISSUES_PLAN.md`;
4. `STABILIZATION_STATUS.md` and the declared support matrix;
5. security, diagnostic, browser-testing, and release-readiness documents;
6. implementation notes, architecture documents, issue reports, and historical plans;
7. upstream examples and reporter-provided patches.

Relevant companion documents include:

* `DEFERRED_ISSUES_PLAN.md`
* `STABILIZATION_STATUS.md`
* `CHANGELOG.md`
* `RELEASE_NOTES.md`
* `docs/qualification/support-matrix.md`, when present
* `docs/qualification/issue-coverage-ledger.md`, when present
* `docs/qualification/manual-browser-protocol.md`, when present
* `diagnostic-playbook.md`
* `open-issue-map.md`
* `release-readiness.md`
* `browser-debugging.md`
* `repository-map.md`
* `issue-199.md`

When documents conflict, follow the higher-priority source and report the conflict. Do not silently weaken security, validation, browser coverage, or release gates.

Issue bodies, comments, patches, changelogs, and status documents are evidence inputs, not automatically established facts. Direct reproduction and current source behavior take priority.

---

## 2. Project purpose

Upgrade and stabilize MCP SuperAssistant as a reliable browser extension for declared Chrome/Chromium and Firefox environments while preserving valid Model Context Protocol behavior.

Primary outcomes:

* truthful connection, discovery, health, and error states;
* correct MCP tool, resource, and prompt discovery;
* CSP-safe handling of valid MCP schemas, including `outputSchema`;
* bounded failure when metadata, results, transports, or servers are malformed;
* reliable tool execution and exactly-once result delivery;
* safe insertion and optional submission on explicitly supported chat sites;
* reconnect, cancellation, reload, and browser-background lifecycle reliability;
* Chrome/Firefox parity where their APIs permit it;
* deterministic contract tests and real-browser evidence;
* reproducible, integrity-checked release artifacts;
* honest documentation of supported and experimental behavior.

“Fully working” means passing a declared support matrix. It does not mean universal compatibility with every MCP server, protocol revision, browser, site, operating system, proxy, schema dialect, or feature request.

Do not expand stabilization into implementing every upstream request. Prioritize security/privacy, data corruption, duplicate side effects, crashes/freezes, unbounded resource growth, discovery, execution, result delivery, reconnect reliability, supported-site regressions, and Chrome/Firefox package validity.

---

## 3. Required inspection before editing

Before changing code, inspect the active checkout and produce this note:

```text
Inspection summary:
- Repository/remote:
- Active branch:
- HEAD commit:
- Working tree clean? yes/no
- Existing unrelated changes:
- Target release/version:
- Upstream baseline commit/tag:
- Node version required/available:
- pnpm version required/available:
- Lockfile state:
- Extension artifact under test:
- Chrome version/OS:
- Firefox version/OS:
- Target site and route:
- MCP SDK version:
- Zod/schema-validator version:
- Proxy package/version:
- Endpoint and transport:
- MCP protocol version negotiated:
- Relevant issue/failure family:
- Reproduction status:
- First suspected failing boundary:
- Existing tests covering the area:
- Proposed files to change:
- Files explicitly not to change:
- Runtime/browser verification available? yes/no
```

Also inspect:

* root and affected-package `package.json` scripts;
* `.nvmrc`, `packageManager`, `engines`, and `pnpm-lock.yaml`;
* `chrome-extension/manifest.ts` and generated Chrome/Firefox manifests;
* the active background entry and imports;
* the responsible transport, client, store, or adapter source;
* current CI workflows;
* current support matrix and stabilization status;
* relevant upstream issue state when issue status matters.

Do not patch from filenames, stack-trace resemblance, generated bundles, historical architecture notes, or issue titles alone.

---

## 4. Working-tree and scope discipline

### 4.1 Preserve user work

* Treat existing modifications and untracked files as user-owned unless proven otherwise.
* Do not discard, reset, overwrite, reformat, stage, or commit unrelated changes.
* Never use destructive Git commands such as `git reset --hard` or broad checkout/clean operations without explicit authorization.
* If requested work overlaps unrelated changes, isolate the patch or ask for direction.

### 4.2 Change the responsible component

Treat these as separate failure domains:

1. MCP server;
2. proxy/forwarder;
3. browser networking and CORS/mixed-content policy;
4. MCP SDK parsing and protocol negotiation;
5. transport plugin;
6. `McpClient` normalization, cache, and state;
7. background/content messaging and storage;
8. content UI/store;
9. site adapter and host DOM;
10. build, manifest transformation, packaging, or store artifact.

Do not patch the extension to conceal a proxy/server defect. Do not patch proxy code for a site-adapter defect. Do not change generated output when TypeScript source is available.

If the responsible project is outside the checked-out repository, report:

```text
outside_repository_scope:
Responsible component:
Evidence:
Required change location:
Safe extension-side mitigation, if any:
Required user decision:
```

### 4.3 Surgical changes

* Implement the smallest durable fix at the earliest failing boundary.
* Add or update a regression test before or with the fix.
* Avoid unrelated refactors, dependency churn, renames, formatting sweeps, generated bundle edits, and design changes.
* Keep functional fixes, dependency upgrades, lint cleanup, and feature work in separate commits/PRs.
* Prefer one failure family or bounded behavior change per PR.

---

## 5. Non-negotiable MCP and CSP rules

### 5.1 Preserve valid protocol data

Do not indiscriminately remove or rewrite valid MCP fields, including:

* `inputSchema`
* `outputSchema`
* `$schema`
* `annotations`
* `title`
* `execution`
* valid unknown/extension metadata
* `structuredContent`
* JSON-RPC IDs, errors, and protocol/session headers

Removing `outputSchema` is acceptable as a controlled diagnostic experiment, not as the default permanent fix.

If a compatibility adapter intentionally omits or transforms valid metadata, document:

* exact affected server/payload;
* why preservation is impossible;
* semantic loss;
* scope and feature flag, if any;
* regression tests;
* removal plan.

### 5.2 Keep extension CSP strict

Forbidden as a bug workaround:

* adding `unsafe-eval`;
* using `eval`, `new Function`, or equivalent runtime code generation;
* disabling validation globally;
* executing remote code or remote schemas;
* broadening host or extension permissions without demonstrated need;
* suppressing schema errors and presenting a healthy state.

Configure, replace, pin, upgrade, or adapt incompatible libraries at a bounded boundary. Scan the packaged Chrome and Firefox execution paths, not just source text.

### 5.3 Handle malformed data without global collapse

* Prefer per-capability or per-item containment when protocol/API semantics permit it.
* One unsupported tool must not silently hide otherwise valid tools.
* Partial discovery must expose which capabilities failed.
* If the SDK validates an entire response atomically, do not claim per-item recovery until a tested adapter actually provides it.
* Invalid tool output must produce a bounded, observable error and must not be inserted as a valid result.

---

## 6. Truthful state and error handling

Transport-object existence is not proof of a healthy MCP connection.

Represent at least these distinct conditions where the architecture permits:

* disconnected;
* connecting;
* initialized but not discovered;
* discovering;
* ready;
* degraded/partial capability failure;
* error;
* reconnecting;
* closing.

Do not conflate:

* server advertises no tools;
* server returns an empty tool list;
* `tools/list` fails;
* SDK validation fails;
* proxy returns an empty or malformed body;
* stale cache contains zero tools;
* browser blocked the request;
* connection closed during discovery.

Rules:

* Never convert a caught discovery exception into a misleading healthy zero-tools state.
* Preserve the original error cause and responsible boundary where safe.
* User-visible errors must be actionable but must not expose secrets, raw authorization data, personal prompts, or tool results.
* A reconnect must not reuse stale success state.
* Cached tools must be invalidated or marked stale according to an explicit policy.
* Do not swallow promise rejections merely to keep the sidebar responsive.

---

## 7. Reproduce before implementing

Create the smallest deterministic reproduction and state expected versus actual behavior.

Use this order:

1. prove the MCP server or fixture independently;
2. prove proxy forwarding and response bytes;
3. capture initialize negotiation and capabilities;
4. capture the failing request/response with secrets redacted;
5. reproduce through the SDK/transport boundary;
6. reproduce through `McpClient` and state/cache;
7. reproduce in the browser background context;
8. reproduce in content messaging/UI;
9. reproduce in the site adapter if relevant.

Record one row per controlled run:

| Commit/artifact | Browser/version | Site | Transport | Endpoint | Proxy/SDK | Payload variant | Connected state | Tool count | First error |
| --------------- | --------------- | ---- | --------- | -------- | --------- | --------------- | --------------- | ---------: | ----------- |

Change one variable per differential comparison. Useful comparisons include:

* known-good versus failing payload;
* field present versus absent;
* Chrome versus Firefox at the same commit;
* unpacked build versus final packaged artifact;
* pinned dependency versus one candidate version;
* clean profile versus existing persisted state;
* supported-site DOM fixture versus current live site;
* pre- and post-service-worker suspension;
* JSON versus SSE-framed Streamable HTTP response.

A hypothesis becomes a root cause only when the original failure is reproducible, a controlled change removes it, reversal restores it where practical, a regression test covers the responsible boundary, and browser behavior agrees with the automated result.

---

## 8. Issue triage and coverage ledger

When working from the upstream backlog:

1. Refresh live issue state before relying on counts or open/closed status.
2. Classify each issue as confirmed defect, plausible defect needing reproduction, duplicate symptom, upstream/configuration problem, feature request, support question, stale/obsolete, or blocked by missing evidence.
3. Cluster by first failing boundary, not by similar wording.
4. Keep duplicate-looking symptoms distinguishable.
5. Treat reporter patches as hypotheses until reviewed and tested.
6. Link a fix to every plausibly affected issue, but claim resolution only for acceptance criteria actually reproduced.
7. Maintain one ledger row per issue.

Required ledger columns:

```text
Issue | Classification | Failure family | Reproduced | Component |
First failing boundary | Test/fixture | Disposition | Release blocker | Evidence gap
```

Do not copy all upstream issues into the fork. Use one fork-local tracking issue plus separate bounded issues for confirmed defects or approved work packages.

---

## 9. Transport and lifecycle rules

For Streamable HTTP, SSE, and WebSocket:

* test each transport independently;
* preserve required `Accept`, content-type, session, and protocol headers;
* distinguish HTTP success from JSON-RPC success;
* preserve request/response IDs;
* handle JSON and supported SSE framing correctly;
* test fragmented chunks, multiple events, empty bodies, invalid bodies, and unsupported content types;
* make connect, disconnect, close, and reconnect idempotent;
* define concurrent-connect behavior;
* bound retries and timeouts;
* propagate cancellation through every responsible layer;
* prevent stale responses from mutating a newer session;
* correlate concurrent calls without cross-wiring results;
* clean sessions, listeners, observers, and timers on teardown.

Exactly-once execution is a release invariant. A timeout, reconnect, duplicated DOM observation, streaming re-render, or late response must not dispatch the same tool call twice.

Test service-worker/background suspension and restart. Keeping DevTools open can alter MV3 worker lifetime, so repeat relevant tests without relying on DevTools to keep the worker alive.

---

## 10. Site-adapter rules

Every site declared `qualified` must pass the same adapter contract:

1. activate only on intended origins and routes;
2. mount injected UI once;
3. avoid damaging host hydration, rendering, or native controls;
4. survive SPA navigation and remount idempotently;
5. locate the active editor through semantic selectors and observable fallbacks;
6. insert plain text, multiline JSON, XML, and fenced code;
7. prove the host application recognized inserted content;
8. submit only when enabled and prove the host state transition;
9. recognize complete tool calls and ignore incomplete or ordinary code;
10. show Run exactly once and auto-execute at most once;
11. insert/render success and structured failure safely;
12. preserve native edit, fork, upload, tool, keyboard, and accessibility behavior;
13. remove injected nodes, observers, listeners, and timers on teardown.

Rules:

* Keep selectors and behavior in per-site adapter modules.
* Maintain fixture evidence and a `last_verified` date for each qualified site.
* Prefer observable readiness over fixed sleep/hydration delays.
* Synthetic events cannot become trusted events; do not build a fix around `isTrusted` becoming true.
* `document.execCommand()` is deprecated and must not be the only insertion path.
* `.click()` returning without error does not prove submission.
* If a site cannot pass the contract, mark it experimental or unsupported in the support matrix, README, and UI rather than retaining a false support claim.
* Do not require authenticated live-site sessions for deterministic CI. Use DOM fixtures in CI and controlled live smoke tests for release evidence.

---

## 11. Result and payload safety

Treat all tool metadata, arguments, results, URLs, Markdown, HTML, images, and binary-like data as untrusted.

Define and test explicit budgets for:

* inline text size;
* structured JSON size and nesting;
* base64/image size;
* streaming buffer size;
* instruction/context size;
* render time and long tasks;
* retained history/cache size.

Do not inject megabytes of base64 into the page DOM. Use bounded previews, truncation with explicit disclosure, or a safe attachment/download path when supported.

Preserve type semantics. A string containing valid JSON, XML, Markdown, or code remains a string unless the protocol/application contract explicitly says otherwise.

Oversized or unsupported results must fail deterministically and visibly without freezing the tab or silently changing content.

---

## 12. Security and privacy

Before release, review:

* background/content/page message sender, origin, target, and schema validation;
* externally reachable or webpage-triggerable extension actions;
* host permissions and `web_accessible_resources`;
* proxy URL validation and private-network assumptions;
* mixed-content and CORS behavior;
* authorization header and bearer-token handling;
* local/session/sync storage threat model;
* tool output rendering, HTML injection, URL handling, and Trusted Types;
* analytics and remote-configuration endpoints;
* source and bundled dependencies, licenses, and unexpected network destinations;
* packaged bundles for runtime code generation and debug globals.

Never capture or publish more authenticated chat traffic than required. Redact:

* cookies;
* authorization headers and MCP credentials;
* personal prompts and conversations;
* tool arguments and results;
* local filesystem details;
* tokens and environment secrets.

Security-scanner findings are leads, not confirmed vulnerabilities. Reproduce exploitability against the relevant source and packaged artifact before assigning severity.

Do not call exposed Firebase web configuration a secret without assessing rules, authorized domains, accessible data, and abuse controls.

---

## 13. Dependency and build discipline

* Use the Node and pnpm versions declared by the repository.
* Install with the lockfile and avoid unnecessary lockfile churn.
* Inspect actual scripts before running them.
* Do not use network-dependent cleanup commands in normal reproducible build paths.
* Keep the MCP SDK exact pin unless an isolated, evidence-backed upgrade is the task.
* Test dependency upgrades separately against the pinned baseline.
* Do not combine SDK/Zod/schema-validator changes with unrelated fixes.
* Do not edit generated `dist`, ZIP, XPI, or minified bundles as source.
* Treat build warnings as unresolved until classified; do not dismiss them as harmless without evidence.

For dependency changes, record:

```text
Pinned baseline:
Candidate version:
Reason:
Affected bundles:
Schema/CSP result:
Transport result:
Chrome result:
Firefox result:
Rollback version:
```

Repository-wide lint debt must remain separate from functional stabilization. Changed files must pass targeted lint. Do not create broad formatting churn to reduce a baseline count.

---

## 14. Chrome and Firefox parity

Do not treat a Chrome build as Firefox verification.

Chrome verification must inspect:

* generated MV3 manifest;
* background service worker;
* unpacked directory extracted from the final ZIP;
* worker suspension/restart;
* final archive integrity.

Firefox verification must inspect:

* Firefox-specific generated manifest;
* module background-script conversion;
* Firefox extension CSP;
* removed/translated unsupported permissions;
* temporary add-on behavior;
* final XPI integrity;
* whether the tested XPI is unsigned, signed, or store-distributed.

Temporary installation of an unsigned XPI does not prove store installability. Archive integrity does not prove runtime behavior.

Use the same commit, fixture service, endpoint semantics, payloads, and test cases when comparing browsers. Isolate browser-specific code only where WebExtension APIs, manifests, or runtime behavior genuinely differ.

---

## 15. Testing requirements

Run the narrowest responsible test first, then expand. Verify current script names before use.

Expected command families include:

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

Do not add `|| true`, suppress exit codes, or interpret zero executed tests as success.

Minimum deterministic coverage where relevant:

* initialize/capability negotiation;
* tool schemas with and without `outputSchema`;
* valid, unsupported, and malformed schema variants;
* one malformed tool among valid tools;
* JSON and SSE-framed Streamable HTTP;
* empty/invalid response paths;
* connect, concurrent connect, disconnect, reconnect, restart, timeout, and cancellation;
* incremental JSONL/XML/tool-call parsing;
* exactly-once dispatch;
* argument/result type preservation;
* large text, structured content, image/base64, and unsupported content;
* storage migrations and cache invalidation;
* manifest generation and packaged-file assertions;
* adapter contract fixtures.

Minimum real-browser core flow for both declared browsers:

1. install/load final candidate artifact;
2. confirm manifest and background context are error-free;
3. confirm target content script activates;
4. connect to deterministic fixture service;
5. verify truthful state and discovered tool count;
6. enable a safe read-only tool and generate instructions;
7. execute manually once;
8. execute automatically at most once;
9. insert/render success and structured failure;
10. verify optional auto-submit by host state transition;
11. reload, navigate, suspend/restart background, interrupt network, and restart proxy;
12. verify malformed and oversized inputs fail safely.

If runtime/browser verification is unavailable, report:

```text
UNVERIFIED_RUNTIME:
- What was statically verified:
- What was not run:
- Why it was unavailable:
- Exact manual reproduction/verification steps:
- Release claim prohibited until completed:
```

Do not mark browser behavior verified from compilation, unit tests, manifest inspection, or archive integrity alone.

---

## 16. E2E and CI integrity

The E2E command must fail when no tests exist or zero tests execute.

Requirements:

* define real package-level E2E scripts;
* run deterministic adapter/transport fixtures in CI;
* load Chrome from files extracted from the final candidate ZIP;
* use a documented Firefox harness or an explicitly named manual release gate;
* record commit, artifact hash, browser, OS, transport, fixture scenario, and site/fixture version;
* capture sanitized background, page, network, and fixture logs;
* retain screenshots/traces for failures;
* make manifest/background load errors fatal.

Do not call Firefox automated if it was manually tested. Do not call live-site testing deterministic if it depends on uncontrolled DOM, authenticated state, experiments, or model output.

---

## 17. Release and packaging rules

* Never overwrite a published release with different code under the same version.
* Any code-bearing change after `v0.6.1` requires a new version, normally `v0.6.2-rc.1` or later.
* Build Chrome and Firefox artifacts from the exact candidate commit.
* Record SHA-256 hashes and archive contents.
* Test clean install and upgrade from the previous published version.
* Preserve a rollback artifact and document storage-migration/downgrade safety.
* Keep a candidate prerelease until the declared matrix passes.
* If a gate fails, publish the known limitation or reduce declared support; do not weaken the gate after observing failure.

Do not claim an upstream issue closed or fixed unless its distinctive acceptance criteria were reproduced. Do not imply the upstream project accepted a fork change.

Preserve required upstream license and copyright attribution. Do not add AI systems, models, agents, or tool vendors as authors, co-authors, contributors, commit trailers, or acknowledgements unless the user explicitly requests it.

---

## 18. Stop conditions

Stop implementation and request a decision when:

* the responsible fix belongs to another repository and no safe bounded mitigation exists;
* the requested change requires weakening CSP or validation;
* the change would broaden powerful permissions without demonstrated need;
* exact supported behavior or release scope is materially ambiguous;
* required authenticated or secret-bearing test data cannot be handled safely;
* user-owned changes overlap the necessary patch and cannot be preserved;
* a dependency upgrade changes protocol semantics beyond the requested scope;
* a site cannot be tested but would still be advertised as qualified;
* a destructive migration or incompatible persisted-state change is required;
* completion requires publishing, pushing, releasing, closing issues, or external communication not authorized by the user.

Use this format:

```text
BLOCKED_DECISION:
Observed constraint:
Why it matters:
Safe options:
Recommended option:
Required user decision:
```

---

## 19. Documentation requirements

For every behavior change, update the applicable documents:

* changelog;
* stabilization status;
* support matrix;
* issue coverage ledger;
* known limitations;
* release notes;
* test/reproduction instructions;
* rollback/migration notes.

Documentation must distinguish:

* verified fact;
* reporter claim;
* source-based inference;
* unverified hypothesis;
* unsupported or experimental behavior.

Do not advertise every manifest match pattern as qualified support. Keep README, manifest, UI, and support matrix consistent.

---

## 20. Required handoff format

After work, report:

```text
Summary:
- Symptom addressed:
- Exact reproduction:
- First failing boundary:
- Root cause:
- Contributing factors:

Changes:
- path: reason

Scope and safety:
- Extension source changed? yes/no
- Proxy changed? yes/no
- MCP server changed? yes/no
- Generated bundles edited directly? no/yes
- CSP weakened? no/yes
- Validation weakened? no/yes
- Permissions broadened? no/yes
- Protocol-valid metadata discarded? no/yes
- Unrelated user changes preserved? yes/no

Validation:
- Commands run and results:
- Tests added/changed:
- Chrome verification:
- Firefox verification:
- Transport verification:
- Site-adapter verification:
- Packaged artifacts/hashes:
- Runtime items not verified:

Issue coverage:
- Issues directly reproduced:
- Issues plausibly affected but unverified:
- Deferred feature requests:
- Reporter confirmation required:

Risks:
- Remaining uncertainty:
- Known limitations:
- Security/privacy considerations:

Rollback:
- 

Next action:
- 
```

Label facts, inferences, and unresolved hypotheses. Include decisive sanitized logs or payload excerpts. Do not claim a root cause when only a workaround has been demonstrated.

---

## 21. Completion standard

Work is complete only when:

1. the original failure has a deterministic reproduction or is explicitly marked unreproduced;
2. the first failing boundary is identified;
3. the smallest responsible fix is implemented;
4. a regression test fails before and passes after the fix where practical;
5. applicable type-check, lint, build, package, and integrity gates pass;
6. Chrome and Firefox behavior is verified proportionately to the changed layer;
7. declared transports and supported sites are verified or documentation is downgraded;
8. errors are observable and bounded;
9. no CSP, permission, validation, privacy, or exactly-once invariant was weakened;
10. issue ledger, support matrix, changelog, and rollback notes match the shipped behavior;
11. remaining uncertainty is explicit;
12. no release, push, issue closure, or external action is claimed unless it actually occurred.
