# MCP SuperAssistant v0.6.3-rc.4

This release candidate supersedes `v0.6.3-rc.3`. It preserves the reconnect/tool-call hang fix, numeric manifest version fix, and manifest icon packaging fix, and adds a targeted parser hotfix for Qwen-style JSONL function-call output that previously rendered as fallback `function` / `block-*` labels.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Clear successful connection timeout timers instead of leaving the 30-second timer pending.
- Add regression tests for reconnect-after-discovery-failure and bounded never-resolving tool calls.
- Use numeric manifest `version` (`0.6.3`) and human-readable `version_name` (`0.6.3-rc.3`) for release-candidate builds. Chrome rejects prerelease strings in the manifest `version` field.
- Add the missing `icon-16.png` file referenced by the manifest. `v0.6.3-rc.2` was rejected by Chrome because this file was absent from the ZIP.
- Add package-contract coverage for numeric manifest versions, release-candidate `version_name` preservation, and declared manifest icon files existing in `dist`.
- Normalize polluted/compact JSONL function-call text before extracting function name, call ID, description, and parameters. This targets Qwen output where detection succeeded but extraction fell back to `function` and generated `block-*` IDs.
- Add parser regression tests for Qwen-style compact/noisy JSONL and incomplete streaming `function_call_start` text.

## Verified in this session

- Targeted JSON parser regression test — PASS, 2 tests.
- `pnpm -F chrome-extension test` — PASS, 16 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- Targeted ESLint for the new parser regression test — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260718-172428.zip`, SHA-256 `ba5530e82bcc5cc0e1fc7b26f86d8c7037c266770ccbee867b827eb45f133f9e`.
  - Firefox XPI: `dist-zip/extension-20260718-172505.xpi`, SHA-256 `da289526b1107729531c47f2cafd44ad26a6274ec1eeb8f5bc6018fbe3db3f62`.
  - Packaged manifest preflight: `version` is `0.6.3`, `version_name` is `0.6.3-rc.4`, Qwen host permission is present, all declared icon files exist, and archive integrity checks pass.

## Not verified in this session

- Chrome runtime on chat.qwen.ai.
- Firefox runtime on chat.qwen.ai.
- Live SSE and Streamable HTTP tool execution through the browser extension.
- Live confirmation that Qwen no longer renders fallback `function` / `block-*` labels for real model output.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Content-script package type-check: `pnpm -F @extension/content-script type-check` still fails on broad baseline/pre-existing errors unrelated to this parser patch.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
