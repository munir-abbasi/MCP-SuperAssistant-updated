# Deferred Issues

Status of upstream issues from [srbhptl39/MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant/issues)
against the `munir-abbasi/MCP-SuperAssistant-updated` fork (commit `8176383`).

Key:
- **✅ Fixed** — resolved by WP4 stabilization or fork cleanup
- **🟡 Partial** — code changes exist but issue may persist in edge cases
- **🔴 Open** — not addressed in this fork
- **⚪ Won't Fix** — platform limitation, de-scoped, or enhancement not planned

---

## Core Protocol & Transport

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **200** | Extension ignores SSE responses in POST Streamable HTTP | 🟡 Partial | Streamable HTTP plugin exists, tests exist, but upstream reporter says it still fails |
| **194/184/183** | `"Already connected to a transport"` on SSE reconnect | ✅ Fixed | `McpClient.ts` disconnects before reconnecting; `cleanup()` fully resets client, plugin, transport, cache, and active calls. Circuit breaker prevents cascading failures. |
| **189** | Empty response body on `tools/list` with Streamable HTTP | 🟡 Partial | Schema validator handles edge cases gracefully, but root transport-level issue may not be fully resolved |
| **157** | Invalid enum value `'http'` (Factory/droid) | 🟡 Partial | Config supports `streamable-http` type. If upstream servers report bare `'http'`, type mismatch may persist |
| **95** | Streamable HTTP Headers not sent | 🔴 Open | Not specifically verified in this fork |
| **81** | Invalid enum value `'sse'` | 🟡 Partial | SSE plugin supports backward-compatible `'sse'` type |

## Schema & Tool Discovery

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **199/191/196** | `outputSchema` in tools/list → 0 tools shown | ✅ Fixed | `inputSchema`/`input_schema`/`schema` fields all handled; `BrowserJsonSchemaValidator` uses cfworker (no CSP clash); fails single tools gracefully not entire list |
| **171** | CSP `unsafe-eval` blocks Ajv schema compile | ✅ Fixed | `BrowserJsonSchemaValidator` uses `@modelcontextprotocol/sdk/validation/cfworker` instead of Ajv. `configureZodForExtension.ts` sets Zod v4 `jitless: true`. Both avoid `new Function`. |
| **158** | `keyValidator._parse is not a function` | ✅ Fixed | CfWorkerJsonSchemaValidator replaces Ajv, no `_parse` issue |
| **202** | Shows no tools but MCP server connected (CLI detects them) | 🔴 Open | Root cause could be any of several issues — schema, transport, or adapter |
| **176** | No tools detected error | 🔴 Open | Umbrella — multiple possible causes |

## Reconnection & Connection Lifecycle

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **155** | Repeated re-execution + `-32001` timeout loop | ✅ Fixed | Circuit breaker (`pages/content/src/core/circuit-breaker.ts`) prevents runaway retry loops. Clean connection state management prevents stuck connections. |
| **68** | Frequent SSE disconnections | ✅ Fixed | Reconnect cleanup, circuit breaker, and WebSocket disconnection callback all hardened |
| **160** | Failed to connect with some MCP versions | 🔴 Open | MCP SDK version compatibility not verified |
| **112** | Request timeout error | 🟡 Partial | 30-second connection timeout configured; may need per-server tuning |
| **186** | Cannot change URI | 🔴 Open | UX issue — not addressed |
| **90** | Server settings page doesn't display all content | 🔴 Open | UX issue — not addressed |

## Platform Adapters

### Qwen
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **148** | Does not work in Qwen | ✅ Fixed | Full `QwenAdapter` plugin (1400+ lines) with robust selectors, text insertion, form submission, file attachment, MCP popover injection. Multiple commit fixes: JSONL extraction, strict instructions, Monaco rendering, spinner fix. |

### DeepSeek
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **193** | No Insert Method — textarea selector broken | 🔴 Open | `DeepSeekAdapter` exists but selectors may need updating for current DeepSeek DOM |
| **172** | "Insert Instruction" + "Insert Output" buttons do nothing | 🔴 Open | Not specifically addressed |

### ChatGPT
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **192** | Function-call card unreliable, Run/Auto-Execute broken | 🔴 Open | Not specifically addressed |
| **174** | Tools not executed with ChatGPT | 🔴 Open | Not specifically addressed |
| **175** | Forces ChatGPT to fall back to GPT-4o (reduces reasoning quality) | 🔴 Open | Not addressed — likely requires adapter level changes |
| **190** | Hydration race detaches/flaps sidebar shadow host (React #418) | 🔴 Open | Not specifically addressed |

### Grok
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **111** | No MCP button appearing (Grok) | 🔴 Open | Grok adapter exists in codebase but issue not verified |
| **136** | Add toggle to disable prompt HTML modification on Grok | 🔴 Open | Feature not implemented |
| **105** | Firefox and Grok issue | 🔴 Open | Not addressed |

### Google AI Studio / Gemini
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **169** | Response stall / incompatibility with Google AI Studio | 🔴 Open | AI Studio adapter exists but issue still open |
| **93** | XML format error in Google AI Studio | 🔴 Open | Not addressed |
| **91** | Markdown file retrieval breaks Gemini integration | 🔴 Open | Not addressed |

### Perplexity
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **94** | XML parse error in Perplexity | 🔴 Open | Not addressed |

## Execution & Rendering

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **167** | No "Run" button to execute JSONL | 🔴 Open | Not addressed |
| **166** | Chinese UI injects `json复制代码` into code blocks, breaking JSON/JSONL copy | 🔴 Open | Not addressed |
| **151** | Plugin freezes and fails to render Base64 images | 🔴 Open | Not addressed |
| **162** | Sometimes doesn't execute | 🔴 Open | Intermittent — hard to reproduce |
| **154** | Cannot execute MCP tools | 🔴 Open | Umbrella — likely connection or schema issue |
| **126** | No tool response registering | 🔴 Open | Not addressed |
| **120** | Unexpected keyword argument `'description'` | 🔴 Open | MCP spec version mismatch |
| **149** | Errors from invoked tools not forwarded to assistant | 🔴 Open | Enhancement — not addressed |
| **201** | Auto Submit button not working | 🟡 Partial | Auto-submit toggle exists in UI but may be broken on some sites |
| **195** | Fix for auto-submit in Grok | 🔴 Open | Not applied |

## Stability & Environment

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| **92** | Extension context invalidated on Linux/Chrome | 🔴 Open | Not addressed |
| **150** | Sidebar hides immediately and cannot be recovered | 🔴 Open | Not addressed |
| **89/86/73** | Failed to initialize SSE MCP server | 🔴 Open | Various connectivity issues |

## Feature Requests (not planned for this fork)

| # | Issue | Rationale |
|---|-------|-----------|
| **187** | arena.ai support | New platform adapter needed |
| **181** | M365 Copilot support | New platform adapter needed |
| **134** | Microsoft Web Copilot support | New platform adapter needed |
| **138** | wrtn.ai support | New platform adapter needed |
| **146** | AI Platform Chat using iframe | New platform adapter needed |
| **164** | Blender Screenshots Integration | Out of scope for extension |
| **182** | Selective tool exposure | Enhancement |
| **129** | UI profiles in side panel | Enhancement |
| **127** | Streamable HTTP bearer auth | Enhancement |
| **123** | OpenAI-compatible API endpoint | Enhancement |
| **109** | Better privacy features | Enhancement |
| **85** | GitHub MCP server setup instructions | Documentation |
| **80** | Configurable request timeout | Enhancement (30s hardcoded) |
| **6/13/14/33/42/65/74/75** | Other platform/feature requests | New adapters or enhancements |

---

## Our Fork's Own Deferred Items

| Item | Priority | Notes |
|------|----------|-------|
| Install Playwright browsers (`npx playwright install chromium`) | Medium | Blocked by slow internet; needed for E2E test execution |
| Verify build succeeds post-cleanup | ~~High~~ **Done (2026-09-07)** | `pnpm type-check` 11/11, `pnpm build` + `pnpm build:firefox` 12/12, node regression suite 10/10. Three latent type errors surfaced and fixed; see `docs/qualification/round-trip-baseline.md` |
| Rename remote `upstream` → `origin` | Low | Cosmetic; `origin` is conventional for your own fork |
| Enable TypeScript strict mode | Low | Requires fixing 200+ `any` types across 18+ files |
| Remove `GITHUB_TOKEN` env var from shell config | Medium | Pushes currently require `unset GITHUB_TOKEN` due to credential override |
| Set up CI (GitHub Actions for lint + build + test) | Low | Nice-to-have for PR quality gating |
| Verify icon-16.png is correct size | Low | Was resized from icon-128; should verify 16×16 is crisp |
| Audit all `any` types in MCP client code | Low | 18+ files have file-level `no-explicit-any` eslint-disable |
