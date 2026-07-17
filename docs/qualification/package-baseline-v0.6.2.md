# Package Baseline Evidence for v0.6.2 Release

Status: package/archive evidence only. This document records build and archive integrity evidence for the final v0.6.2 release. All browser runtime qualification was completed separately in manual and guided smoke tests.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch | `main` | Verified |
| HEAD | `b358c4bd1f4eeb585a1cc9a48df9485b5a0c994f` | Verified |
| Current package/manifest version | `0.6.2` | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0` | Verified |
| pnpm required/used | `9.15.1` | Verified |

## Final Artifacts

| Artifact | On-disk bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260717-163603.zip` (Chrome) | 2717057 | `31e533d01e4b59cb614bb0bca879a48473f964cf37fdb29ddca2b68850824921` | Verified |
| `dist-zip/extension-20260717-163027.xpi` (Firefox) | 2717103 | `f022237e6576c8bf4746a41d70d9ffb935228fe00a19997c4e76a453a63641b5` | Verified |

### Uncompressed Totals

| Artifact | Uncompressed bytes |
| --- | ---: |
| Chrome ZIP | 5,261,440 |
| Firefox XPI | 5,261,544 |

Both archives contain 18 files with identical structure: Cover media, background.js, content scripts, manifest, locales, and UI assets.

## Manifest Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.2` | `0.6.2` | Verified |
| `name` | `MCP SuperAssistant` | `MCP SuperAssistant` | Verified |
| Gecko ID | `saurabh@mcpsuperassistant.ai` present | `saurabh@mcpsuperassistant.ai` present | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |

## Verification Gates

| Gate | Result | Label |
| --- | --- | --- |
| `pnpm build` (Chrome) | PASS | Verified |
| `pnpm build:firefox` | PASS | Verified |
| `pnpm -F chrome-extension test` | PASS: 7 tests, 7 pass, 0 fail | Verified |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm e2e` — contract tests | 15 pass, 1 fail (pre-existing fixture server) | Verified |
| `pnpm e2e` — MCP protocol | 13/13 PASS | Verified |
| Chrome manual smoke on 3 chat sites | PASS | Verified |
| Firefox XPI load + manual smoke | PASS | Verified |
| Guided browser protocol (Chrome + Firefox) | PASS | Verified |
