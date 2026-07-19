# Package Baseline Evidence for v0.6.3-rc.3

> Superseded: `v0.6.3-rc.3` fixed package loadability but was followed by Qwen runtime reports where polluted/compact JSONL function-call output could render as fallback `function` / `block-*`, incomplete function blocks could keep spinning, and the generic instruction template could be copied into live output. Use `v0.6.3-rc.6` or later.

Status: release-candidate package/archive evidence only. This document records automated build, package, manifest, icon, and archive integrity evidence for `v0.6.3-rc.3`. It does not record live browser runtime qualification.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch during packaging | `release/v0.6.3-rc.3` | Verified |
| Base HEAD before hotfix commit | `ac38224aa1e537f05e72feb60f816b465db9f640` (`fix(manifest): Use numeric extension version for RC builds`) | Verified |
| Current package version | `0.6.3-rc.3` | Verified |
| Manifest version fields | `version: 0.6.3`; `version_name: 0.6.3-rc.3` | Verified |
| Icon hotfix | `chrome-extension/public/icon-16.png` exists and packages as `icon-16.png` | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0`; exact `.nvmrc` runtime was not available locally | Verified |
| pnpm required/used | `9.15.1` | Verified |
| MCP SDK | `@modelcontextprotocol/sdk` `1.25.2` in `chrome-extension/package.json` | Verified |

## Final Artifacts

| Artifact | On-disk bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260718-160502.zip` (Chrome) | 2,717,715 | `7e461782ec66f0b89de0f012024be5fa626ddf4d901bfeae0402a9889f99534e` | Verified |
| `dist-zip/extension-20260718-160543.xpi` (Firefox) | 2,717,734 | `3f665b3a0524b1720dd623dd0737837bd1d36bb9c9363e3bd71c6cb784775942` | Verified |

### Uncompressed Totals

| Artifact | Uncompressed bytes | File count |
| --- | ---: | ---: |
| Chrome ZIP | 5,262,411 | 19 |
| Firefox XPI | 5,262,515 | 19 |

Both archives contain the expected packaged structure: cover media, `background.js`, content assets, manifest, locale files, UI assets, and all manifest-declared icon files.

## Manifest and Icon Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.3` | `0.6.3` | Verified |
| `version_name` | `0.6.3-rc.3` | `0.6.3-rc.3` | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |
| Permissions | `storage`, `clipboardWrite` | `storage`, `clipboardWrite` | Verified |
| Qwen host permission | `*://*.chat.qwen.ai/*` present | `*://*.chat.qwen.ai/*` present | Verified |
| Numeric manifest version preflight | PASS | PASS | Verified |
| Manifest icon paths | `icon-16.png`, `icon-34.png`, `icon-128.png` all present | `icon-16.png`, `icon-34.png`, `icon-128.png` all present | Verified |
| `icon-16.png` dimensions | PNG 16x16, 327 bytes | PNG 16x16, 327 bytes | Verified |

## Verification Gates

| Gate | Result | Label |
| --- | --- | --- |
| `pnpm -F chrome-extension exec eslint manifest.ts` | PASS | Verified |
| `pnpm -F chrome-extension test` | PASS, 14/14 | Verified |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm -F chrome-extension lint` | Known broad baseline/pre-existing failure from previous pass: 849 errors; not rerun for rc.3 | Verified boundary |
| `pnpm e2e` | PASS, 15/15; includes numeric manifest `version`, `version_name`, and manifest icon existence assertions | Verified |
| `pnpm e2e:firefox` | PASS, 15/15; includes numeric manifest `version`, `version_name`, and manifest icon existence assertions | Verified |
| `unzip -t dist-zip/extension-20260718-160502.zip` | PASS, no errors detected | Verified |
| `unzip -t dist-zip/extension-20260718-160543.xpi` | PASS, no errors detected | Verified |
| Packaged runtime-code-generation token scan | PASS; no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files | Verified |
| Extracted Chrome directory preflight | PASS: `/tmp/mcp-superassistant-chrome-test-rc3-20260718-160502` contains every manifest-declared icon | Verified |

## Build Warnings and Caveats

- Builds emitted the existing Browserslist/caniuse-lite stale-data warning.
- Builds emitted existing `vite-plugin-lib-assets` “file not found ... .js” warnings for TypeScript source imports using `.js` specifiers. The build completed and produced archives.
- The local Node runtime was `v24.12.0`, not the exact `.nvmrc` `22.12.0`; it satisfies the root `>=22.12.0` engine constraint but is not exact-release reproducibility evidence.
- Historical archives remain in `dist-zip/`; only the timestamped artifacts listed above are the final `v0.6.3-rc.3` artifacts from this validation pass.

## Runtime Verification Boundary

Not run in this session:

- Chrome runtime loading on `chat.qwen.ai`.
- Firefox runtime loading on `chat.qwen.ai`.
- Live browser tool execution through SSE.
- Live browser tool execution through Streamable HTTP.
- Background service-worker suspension/restart behavior in a real browser.

Do not promote `v0.6.3-rc.3` beyond release-candidate status until the live browser/runtime matrix is completed.
