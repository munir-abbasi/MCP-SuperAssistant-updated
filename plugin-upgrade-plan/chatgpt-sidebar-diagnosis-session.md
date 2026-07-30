# ChatGPT Sidebar Disappearance Diagnosis Session

Date: 2026-07-16

## Current Status

This session was saved after a read-only diagnosis of a ChatGPT-specific MCP SuperAssistant sidebar disappearance.

No files were changed in the nested extension checkout:

`/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1`

The local checkout was dirty before diagnosis. Preserve the existing dirty worktree and generated artifacts.

## Best Static Diagnosis

The strongest evidence-based hypothesis is that the disappearing sidebar on `chatgpt.com` is caused by origin-local persisted UI state in ChatGPT's localStorage, not by MCP server, proxy, or core tool discovery failure.

Why this fits:

- The extension works on `gemini.google.com` and `https://chat.qwen.ai` in the same browser.
- `localStorage` is origin-scoped, so ChatGPT, Gemini, and Qwen each have separate `mcp-super-assistant-ui-store` values.
- Static source inspection found that `SidebarPlugin.activate()` calls `SidebarManager.showWithToolOutputs()`.
- `showWithToolOutputs()` reads `localStorage['mcp-super-assistant-ui-store']` and respects persisted state:
  - if `state.mcpEnabled === false`, sidebar initialization is skipped;
  - if `state.sidebar.isVisible === false`, the shadow host is hidden after initialization.
- This can produce the observed behavior: sidebar appears briefly after refresh, then disappears.
- No automatic same-host ChatGPT navigation path was found that clearly hides or destroys the sidebar.
- Explicit hide paths found were user/message/persisted-state driven.

This is still a strong static hypothesis, not a confirmed runtime root cause. Browser console inspection on `chatgpt.com` is still required.

## Read-Only ChatGPT Inspection Snippet

Run this first on `chatgpt.com` after the sidebar disappears:

```js
const raw = localStorage.getItem('mcp-super-assistant-ui-store');
const parsed = raw ? JSON.parse(raw) : null;

console.log({
  raw,
  mcpEnabled: parsed?.state?.mcpEnabled,
  sidebarVisible: parsed?.state?.sidebar?.isVisible,
  shadowHost: document.querySelector('#mcp-sidebar-shadow-host'),
  shadowHostStyle: document.querySelector('#mcp-sidebar-shadow-host')?.getAttribute('style'),
  shadowHostClass: document.querySelector('#mcp-sidebar-shadow-host')?.className,
});
```

Interpretation:

- If `mcpEnabled: false`, ChatGPT-origin MCP state is disabled.
- If `sidebarVisible: false`, ChatGPT-origin sidebar visibility is persisted hidden.
- If either is false, that supports the persisted-state diagnosis.
- If both are enabled/visible but `shadowHost` is missing or hidden, continue diagnosis into sidebar recovery/remount and ChatGPT DOM lifecycle.

## Conditional Reset Snippet

Only run this if the read-only inspection shows `mcpEnabled: false` or `sidebarVisible: false`:

```js
const key = 'mcp-super-assistant-ui-store';
const data = JSON.parse(localStorage.getItem(key) || '{}');

data.state ??= {};
data.state.mcpEnabled = true;
data.state.sidebar ??= {};
data.state.sidebar.isVisible = true;
data.state.sidebar.isMinimized = false;

localStorage.setItem(key, JSON.stringify(data));
location.reload();
```

## If Reset Does Not Fix It

If ChatGPT localStorage is already enabled and visible, or resetting does not restore the sidebar, the next suspects are:

1. Sidebar remount/recovery behavior in `pages/content/src/components/sidebar/index.ts`.
2. ChatGPT DOM lifecycle removing or hiding `#mcp-sidebar-shadow-host`.
3. ChatGPT adapter composer popover injection selectors failing separately from the universal sidebar.
4. Runtime-only content script or service-worker behavior not visible from static inspection.

## Repo State Facts

Nested checkout:

`/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1`

Confirmed during diagnosis:

- Branch: `main`
- HEAD: `6abee1d`
- Origin: `https://github.com/munir-abbasi/MCP-SuperAssistant-updated.git`
- Upstream: `https://github.com/srbhptl39/MCP-SuperAssistant.git`
- Required Node from `.nvmrc`: `22.12.0`
- Available Node during session: `v24.12.0`
- pnpm: `9.15.1`
- MCP SDK: `@modelcontextprotocol/sdk 1.25.2`

Pre-existing dirty/untracked files were present. Do not overwrite or revert them without explicit user approval.

## Verification Status

Static source and documentation inspection: completed.

Runtime/browser verification: not performed yet.

Root cause status: strong static hypothesis, pending ChatGPT console/localStorage confirmation.
