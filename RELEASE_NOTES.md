# MCP SuperAssistant v0.6.3-rc.6

This release candidate supersedes `v0.6.3-rc.5`. It preserves the reconnect/tool-call hang fix, numeric manifest version fix, manifest icon packaging fix, Qwen JSONL extraction fix, and bounded incomplete-block handling, and adds a Qwen-specific instruction-template fix so Qwen is no longer given the generic `<thoughts>`/response-format scaffold it copied into live output.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Use numeric manifest `version` (`0.6.3`) and human-readable `version_name` (`0.6.3-rc.6`) for release-candidate builds.
- Include all manifest-declared icons, including `icon-16.png`.
- Normalize polluted/compact JSONL function-call text before extracting function name, call ID, description, and parameters.
- Monitor the actual rendered function-block ID after rendering, so incomplete JSON function blocks can be marked as abruptly ended instead of spinning indefinitely.
- Recover function name/call ID from partial JSON starts even when Qwen prefixes natural-language text before the opening `{`.
- Reword JSONL instructions so the model emits a complete function-call block and stops for extension execution controls instead of asking the user to execute JSONL manually.
- Route Qwen through a strict JSONL-only instruction template that forbids visible planning tags, `<thoughts>`/response-format scaffolding, manual-execution wording, and partial `function_call_start`-only output.
- Preserve the generic instruction template for non-Qwen hosts, including the existing ChatGPT and Gemini addenda.

## Verified in this session

- Targeted JSON parser regression test — PASS, 3 tests.
- Targeted Qwen instruction-generator regression test — PASS, 2 tests.
- `pnpm -F chrome-extension test` — PASS, 19 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- Targeted ESLint for the parser regression test and Qwen instruction-generator test — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260719-061323.zip`, SHA-256 `531b7c620bda0ae9cc8637357b4863759fafc1486d48eed4715eba31a94d1028`.
  - Firefox XPI: `dist-zip/extension-20260719-061403.xpi`, SHA-256 `ef51c6206009d6f889b95ea234da36eeacd8704cff1efbeadfb9ff8489d884c9`.
  - Packaged manifest preflight: `version` is `0.6.3`, `version_name` is `0.6.3-rc.6`, Qwen host permission is present, all declared icon files exist, and archive integrity checks pass.
  - Packaged runtime-code-generation token scan found no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files.

## Not verified in this session

- Chrome runtime on chat.qwen.ai.
- Firefox runtime on chat.qwen.ai.
- Live SSE and Streamable HTTP tool execution through the browser extension.
- Live confirmation that Qwen no longer renders a continuous spinner for real model output.
- Live confirmation that Qwen emits a complete JSONL block without copying `<thoughts>` or manual-execution wording.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Content-script package type-check: `pnpm -F @extension/content-script type-check` still fails on broad baseline/pre-existing errors unrelated to this parser patch.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
