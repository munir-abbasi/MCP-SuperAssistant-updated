# Repository map

This map reflects `srbhptl39/MCP-SuperAssistant` at commit `c26168ee2c5708a3a65ef5afd88cda1a97c81734` (2026-02-09). Re-inspect the checkout because paths and behavior may change.

## Runtime flow

`MCP server -> local proxy/remote endpoint -> MCP SDK Client -> transport plugin -> McpClient normalization/cache -> background messaging -> content-script stores/sidebar -> target-site adapter`

## Important paths

| Area | Path | Role |
| --- | --- | --- |
| Extension manifest | `chrome-extension/manifest.ts` | MV3 permissions, background worker, content scripts, hosts |
| Firefox conversion | `packages/dev-utils/lib/manifest-parser/impl.ts` | Converts service worker to background scripts, adds extension CSP, removes unsupported permissions |
| Background entry | `chrome-extension/src/background/index.ts` | Extension background runtime entry |
| MCP orchestration | `chrome-extension/src/mcpclient/core/McpClient.ts` | Plugin selection, primitive retrieval, normalization, cache, events |
| Streamable HTTP | `chrome-extension/src/mcpclient/plugins/streamable-http/StreamableHttpPlugin.ts` | MCP client connection and primitive discovery |
| SSE | `chrome-extension/src/mcpclient/plugins/sse/SSEPlugin.ts` | SSE connection and primitive discovery |
| WebSocket | `chrome-extension/src/mcpclient/plugins/websocket/WebSocketPlugin.ts` | WebSocket connection and primitive discovery |
| Content app | `pages/content/src` | Sidebar UI, stores, messaging, site adapters |
| Extension build | `chrome-extension/vite.config.mts` | Background bundle and manifest generation |
| Workspace scripts | `package.json` | build, Firefox build, ZIP, lint, type-check, E2E commands |
| CI | `.github/workflows/e2e.yml` | Chrome and Firefox E2E jobs |

## Known design details

- The repository is a pnpm/Turborepo TypeScript monorepo and requires the versions declared in `.nvmrc`, `packageManager`, and `engines`.
- At the mapped commit, the extension depends on `@modelcontextprotocol/sdk ^1.20.2` and `zod ^4.3.5`.
- Each transport calls the SDK `client.listTools()` before `McpClient.normalizeTools()` runs. A parsing failure can therefore occur before the extension discards unneeded tool metadata.
- `normalizeTools()` maps `name`, `description`, and input schema into extension fields. It does not itself compile `outputSchema`.
- Streamable HTTP catches individual capability-list failures and logs warnings, allowing discovery to complete with zero tools; SSE and WebSocket error propagation differs. Compare transport behavior explicitly.
- Chrome uses an MV3 service worker. The Firefox manifest converter replaces it with module background scripts and supplies an extension CSP.
- Production builds are minified and development builds have sourcemaps. Prefer development builds for localization.

## Architecture cautions

- Two MCP client implementations or legacy paths may coexist. Follow imports from the active background entry instead of editing the first matching file.
- Generated `dist` output is not the source of truth.
- Target chat sites change independently of the extension; distinguish protocol discovery from DOM injection and result insertion.
- Store packages may lag the repository. Record source commit and installed extension version separately.
