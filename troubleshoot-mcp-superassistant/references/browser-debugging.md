# Chrome and Firefox debugging

## Chrome/Chromium

1. Build the development extension using the repository script.
2. Open `chrome://extensions`, enable Developer mode, load the generated unpacked directory, and record the extension ID/version.
3. Use the extension card's service-worker inspection link for background logs.
4. Open target-page DevTools for content-script, DOM, and Network evidence.
5. After rebuilding, reload the extension and then reload the target tab. Confirm the worker and content script came from the new build.
6. Test after allowing the service worker to suspend and restart.

## Firefox

1. Generate the Firefox-specific build; do not load the Chrome manifest and call that Firefox coverage.
2. Use `about:debugging#/runtime/this-firefox` to load the generated temporary add-on manifest and inspect it.
3. Inspect the add-on background context and target-page console separately.
4. Compare the emitted Firefox manifest with the Chrome manifest, especially `background`, CSP, permissions, host permissions, and `browser_specific_settings`.
5. If packaging behavior matters, also test the generated Firefox ZIP in the supported validation/install path.

## Cross-browser rules

- Run both browsers against the same commit, fixture, proxy, endpoint semantics, and MCP server.
- Record browser versions because MV3 and extension CSP behavior evolve.
- Do not loosen CSP to permit runtime code generation. Identify the library generating code and replace/configure/move that behavior safely.
- Prefer `webextension-polyfill` or existing project abstractions when an API differs, but confirm the active code path.
- Verify clean installation, upgrade/persisted state, reconnect, reload, and background restart when the changed layer can affect them.

## Security guardrails

- Never capture or publish authenticated chat-site traffic beyond what is necessary.
- Redact cookies, authorization headers, MCP credentials, personal prompts, tool results, and local paths.
- Do not broaden `<all_urls>`/host permissions or add powerful extension permissions without a demonstrated requirement and explicit review.
- Treat remote schemas and server metadata as untrusted input. Avoid evaluation and runtime code generation in extension contexts.
