# Package Baseline Evidence for v0.6.2-rc.1 Candidate

Status: package/archive evidence only. This document records build and archive integrity evidence for the current dirty checkout. It does not qualify runtime browser behavior.

## Evidence Labels

- Verified: directly observed in this checkout through file inspection or command output.
- Claimed: recorded in project documents, issue reports, or build logs but not independently reproduced here.
- Inferred: source-based conclusion that still needs runtime confirmation.
- Unknown: missing or not yet inspected.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch | `main` | Verified |
| HEAD | `6abee1dfc1bdb7287c450e1b5794369b4e93e02f` | Verified |
| Working tree | Dirty: modified tracked files (docs, config, version bumps) and untracked `.omo/`, `dist-zip/` artifacts, root ZIP/XPI | Verified |
| Current package/manifest version | `0.6.2-rc.1` | Verified |
| Code-bearing release target | `v0.6.2-rc.1` | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0` | Verified |
| pnpm required/used | `9.15.1` | Verified |
| Lockfile SHA-256 | `f9644871e1255c090e2eb1de91559d278e25fb5a2d23d70acf2c03821c9af972` | Verified |

## Pre-existing Root Artifacts

These untracked root artifacts existed before the T3 package run. Zipper source inspection showed new packages are written to timestamped files under `dist-zip/`, so these root files were not expected to be overwritten.

| Artifact | SHA-256 | Label |
| --- | --- | --- |
| `MCP-SuperAssistant-0.6.1-chrome.zip` | `3379868f506083067f1a82c494067ae8c09bef12a79d189b364d8b2b5eecc148` | Verified |
| `MCP-SuperAssistant-0.6.1-firefox.xpi` | `1a559c94b34037117e7e7db8ae53281dc11e7dab9b22163acad2075d63347eff` | Verified |

## Pre-package Verification

| Command | Result | Label |
| --- | --- | --- |
| `pnpm -F chrome-extension test` | PASS: 7 tests, 7 pass, 0 fail | Verified |
| `pnpm -F chrome-extension type-check` | PASS: `tsc --noEmit` completed with no error output | Verified |

The 7 passing tests include the existing JSON Schema/#199 tests, existing Streamable HTTP JSON/SSE-framed discovery tests, and the two new discovery-state regressions for primitive discovery failure and stale cache invalidation.

E2E package-contract tests: 14 pass, 2 fail (2 fixture-server unreachable via localhost:3021 - pre-existing, not related to version assertion, which now passes).

## Package Commands

| Command | Result | Output artifact | Label |
| --- | --- | --- | --- |
| `pnpm zip` | PASS | `dist-zip/extension-20260717-135958.zip` | Verified |
| `pnpm zip:firefox` | PASS | `dist-zip/extension-20260717-140039.xpi` | Verified |

Both commands ran the repository build pipeline before packaging. `pnpm zip` ran `pnpm build && pnpm -F zipper zip`; `pnpm zip:firefox` ran `pnpm build:firefox && pnpm -F zipper zip`.

## Produced Archives

| Artifact | Size bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260717-135958.zip` | 2717061 | `322878f04a3c02c97960a10fd7148da218df91a637b245d7b35551f316b6b6c9` | Verified |
| `dist-zip/extension-20260717-140039.xpi` | 2717107 | `ddb4d46993d52d6022fd762217ee784f1d7f7270386af209f092a95714cc9029` | Verified |

## Archive Contents

Both archives contain 18 files:

```text
Cover1.jpg
Cover2.png
Cover3.jpg
Cover4.jpg
Cover5.jpg
background.js
codemirror-accessor.js
content.css
dragDropListener.js
icon-128.png
icon-34.png
json_function_call_extractor.js
manifest.json
content/index.css
content/index.iife.js
content/logo.svg
_locales/ko/messages.json
_locales/en/messages.json
```

Chrome ZIP uncompressed total: `5261445` bytes. Firefox XPI uncompressed total: `5261549` bytes.

## Manifest Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.2-rc.1` | `0.6.2-rc.1` | Verified |
| `name` | `MCP SuperAssistant` | `MCP SuperAssistant` | Verified |
| Gecko ID | `saurabh@mcpsuperassistant.ai` present | `saurabh@mcpsuperassistant.ai` present | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |
| CSP | No visible `content_security_policy` field in inspected manifest | `extension_pages: script-src 'self'; object-src 'self'` | Verified |
| Host/content scope | Broad manifest match patterns for many chat sites | Broad manifest match patterns for many chat sites | Verified |

Manifest match patterns are packaging scope only. They are not evidence that a site is qualified support.

## Build Warnings

These warnings did not fail the package commands, but remain unresolved and should not be silently treated as clean release evidence:

- Turborepo printed its anonymous telemetry notice.
- `@extension/content-script:build` reported stale Browserslist/caniuse-lite data: 17 months old.
- `chrome-extension:build` printed multiple nonfatal `[vite-plugin-lib-assets]: file not found ... .js` warnings for TypeScript-source-derived paths, including MCP client, plugin, configuration, analytics, and logger paths.

No dependency update, Browserslist update, lint cleanup, or generated-bundle source edit was performed during T3.

## UNVERIFIED_RUNTIME

The following were not run in this T3 pass:

- Chrome install/load of the generated ZIP.
- Firefox install/load of the generated XPI.
- Background service worker or Firefox background runtime smoke test.
- Target-site content-script activation.
- Fixture MCP connection from browser runtime.
- Browser-runtime tool discovery, execution, result insertion, or failure rendering.
- Reload, reconnect, service-worker lifecycle, or proxy restart checks.
- Supported-site insertion/submission contract checks.
- Upgrade or persisted-state migration checks.

Release claim prohibited until completed: do not call these archives browser-qualified, release-qualified, or stable. Build success, manifest inspection, archive listing, and SHA-256 hashes are package integrity evidence only.

## Rollback and Preservation

- Pre-existing root ZIP/XPI hashes were recorded before packaging.
- New generated archives were isolated under `dist-zip/` with timestamped filenames.
- No published release was overwritten.
- No push, release, issue closure, or external communication occurred.
- No lockfile, dependency, CSP, permission, or generated source edit was made for T3.

## Next Action

Proceed to release: git add, commit as `release: v0.6.2-rc.1`, tag v0.6.2-rc.1, push origin main --tags, create GitHub release with RELEASE_NOTES.md body.
