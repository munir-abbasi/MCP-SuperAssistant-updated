# MCP SuperAssistant v0.6.3-rc.7

This release candidate supersedes `v0.6.3-rc.6`. It preserves the reconnect/tool-call hang fix, numeric manifest version fix, manifest icon packaging fix, Qwen JSONL instruction fix, and bounded incomplete-block handling, and adds Qwen runtime fixes for Monaco virtualization, stale first-line extraction, and ChatGPT sidebar host recovery.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Use numeric manifest `version` (`0.6.3`) and human-readable `version_name` (`0.6.3-rc.7`) for release-candidate builds.
- Include all manifest-declared icons, including `icon-16.png`.
- Normalize polluted/compact JSONL function-call text before extracting function name, call ID, description, and parameters.
- Monitor the actual rendered function-block ID after rendering, so incomplete JSON function blocks can be marked as abruptly ended instead of spinning indefinitely.
- Recover function name/call ID from partial JSON starts even when Qwen prefixes natural-language text before the opening `{`.
- Reword JSONL instructions so the model emits a complete function-call block and stops for extension execution controls instead of asking the user to execute JSONL manually.
- Route Qwen through a strict JSONL-only instruction template that forbids visible planning tags, `<thoughts>`/response-format scaffolding, manual-execution wording, and partial `function_call_start`-only output.
- Preserve the generic instruction template for non-Qwen hosts, including the existing ChatGPT and Gemini addenda.
- Extract complete Qwen JSONL from Monaco model or React-backed data before creating hidden extracted pre elements.
- Do not create Qwen hidden pre elements from first-line-only Monaco viewport content.
- Do not target Qwen's original virtualized `pre`/`code` wrappers for function-block rendering; render only from complete extracted hidden pre elements.
- Recover the ChatGPT sidebar shadow host after ChatGPT hydration/remount removes it while persisted state says the sidebar should remain visible.
- Fix CodeMirror accessor cleanup so stopping the accessor no longer iterates a `WeakSet`.

## Verified in this session

- Targeted CodeMirror/Qwen accessor and JSON parser regression tests — PASS, 8 tests.
- Targeted Qwen instruction-generator regression test — PASS, 2 tests.
- `pnpm -F chrome-extension test` — PASS, 24 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260719-154329.zip`, SHA-256 `34daf6850a79f1f06b1f8cf178f9d5285b19890e4d21d755204b10fb131ba6d6`.
  - Firefox XPI: `dist-zip/extension-20260719-154400.xpi`, SHA-256 `45d3262cdf137030a2c9f4432175c644af09dfcd1aee5f485ee46d119de1626a`.
  - Packaged manifest preflight: `version` is `0.6.3`, `version_name` is `0.6.3-rc.7`, Qwen host permission is present, all declared icon files exist, and archive integrity checks pass.
  - Packaged runtime-code-generation token scan found no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files.

## Not verified in this session

- Firefox runtime on chat.qwen.ai for rc7.
- Full live SSE and Streamable HTTP matrix through the browser extension.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Content-script package type-check: `pnpm -F @extension/content-script type-check` still fails on broad baseline/pre-existing errors unrelated to this parser patch.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

## Runtime notes

- Chrome/Qwen live runtime was verified during rc7 preparation: extracted Qwen JSONL rendered and the Run control appeared after the selector/extraction fixes.
- ChatGPT sidebar host recovery was verified during rc7 preparation by user runtime retest.
- The first-load SSE 404 can appear before selecting the desired transport; this candidate does not change that behavior because the user confirmed it clears after choosing Streamable HTTP or SSE.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
