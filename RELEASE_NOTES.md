# MCP SuperAssistant v0.6.3-rc.5

This release candidate supersedes `v0.6.3-rc.4`. It preserves the reconnect/tool-call hang fix, numeric manifest version fix, manifest icon packaging fix, and Qwen JSONL extraction fix, and adds a bounded-spinner hotfix for incomplete Qwen function-call blocks.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Use numeric manifest `version` (`0.6.3`) and human-readable `version_name` (`0.6.3-rc.5`) for release-candidate builds.
- Include all manifest-declared icons, including `icon-16.png`.
- Normalize polluted/compact JSONL function-call text before extracting function name, call ID, description, and parameters.
- Monitor the actual rendered function-block ID after rendering, so incomplete JSON function blocks can be marked as abruptly ended instead of spinning indefinitely.
- Recover function name/call ID from partial JSON starts even when Qwen prefixes natural-language text before the opening `{`.
- Reword JSONL instructions so the model emits a complete function-call block and stops for extension execution controls instead of asking the user to execute JSONL manually.

## Verified in this session

- Targeted JSON parser regression test — PASS, 3 tests.
- `pnpm -F chrome-extension test` — PASS, 17 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- Targeted ESLint for the parser regression test — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260718-180830.zip`, SHA-256 `ecb4d6f8db3358142e71ba7cea165e8f3011df620b5e788c03155562f52ed77d`.
  - Firefox XPI: `dist-zip/extension-20260718-180906.xpi`, SHA-256 `3c6ad152bf970d633a11f487bb8eb537c5385f184b9d5f583f5926576b4d54ff`.
  - Packaged manifest preflight: `version` is `0.6.3`, `version_name` is `0.6.3-rc.5`, Qwen host permission is present, all declared icon files exist, and archive integrity checks pass.
  - Packaged runtime-code-generation token scan found no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files.

## Not verified in this session

- Chrome runtime on chat.qwen.ai.
- Firefox runtime on chat.qwen.ai.
- Live SSE and Streamable HTTP tool execution through the browser extension.
- Live confirmation that Qwen no longer renders a continuous spinner for real model output.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Content-script package type-check: `pnpm -F @extension/content-script type-check` still fails on broad baseline/pre-existing errors unrelated to this parser patch.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
