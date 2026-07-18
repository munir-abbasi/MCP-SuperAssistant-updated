# MCP SuperAssistant v0.6.3-rc.3

This release candidate supersedes `v0.6.3-rc.2`. It preserves the reconnect/tool-call hang fix, preserves the numeric manifest version fix, and adds the missing `icon-16.png` asset required by the packaged manifest.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Clear successful connection timeout timers instead of leaving the 30-second timer pending.
- Add regression tests for reconnect-after-discovery-failure and bounded never-resolving tool calls.
- Use numeric manifest `version` (`0.6.3`) and human-readable `version_name` (`0.6.3-rc.3`) for release-candidate builds. Chrome rejects prerelease strings in the manifest `version` field.
- Add the missing `icon-16.png` file referenced by the manifest. `v0.6.3-rc.2` was rejected by Chrome because this file was absent from the ZIP.
- Add package-contract coverage for numeric manifest versions, release-candidate `version_name` preservation, and declared manifest icon files existing in `dist`.

## Verified in this session

- Targeted discovery-state test — PASS.
- `pnpm -F chrome-extension test` — PASS, 14 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- Targeted ESLint for the edited discovery-state test — PASS.
- Targeted ESLint for `chrome-extension/manifest.ts` — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260718-160502.zip`, SHA-256 `7e461782ec66f0b89de0f012024be5fa626ddf4d901bfeae0402a9889f99534e`.
  - Firefox XPI: `dist-zip/extension-20260718-160543.xpi`, SHA-256 `3f665b3a0524b1720dd623dd0737837bd1d36bb9c9363e3bd71c6cb784775942`.
  - Packaged manifest preflight: `version` is `0.6.3`, `version_name` is `0.6.3-rc.3`, Qwen host permission is present, all declared icon files exist, and archive integrity checks pass.

## Not verified in this session

- Chrome runtime on chat.qwen.ai.
- Firefox runtime on chat.qwen.ai.
- Live SSE and Streamable HTTP tool execution through the browser extension.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
