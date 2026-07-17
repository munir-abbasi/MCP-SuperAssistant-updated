# Manual Browser Qualification Protocol

Status: guided manual test protocol for collecting Chrome and Firefox runtime qualification evidence.

This protocol defines the step-by-step manual test sequence to qualify a packaged extension artifact against the release promotion gates. Each step produces specific evidence that is recorded in the support matrix and issue coverage ledger.

## Prerequisites

- Packaged artifact: Chrome ZIP (`dist-zip/extension-*.zip`) and Firefox XPI (`dist-zip/extension-*.xpi`) from the same candidate commit.
- Browser: Chrome/Chromium stable (or ungoogled-chromium) and Firefox stable.
- MCP server: A known-working MCP server (e.g., `filesystem`) with the endpoint URL recorded.
- Protocol output document: This file IS the protocol — record results per step.

## Step 1: Install and load

### Chrome

1. Navigate to `chrome://extensions`.
2. Enable Developer mode (toggle top-right).
3. Click "Load unpacked" and select the unzipped extension directory (extracted from the candidate ZIP).
4. Verify the extension card appears with:
   - Name "MCP SuperAssistant"
   - Version matching the candidate
   - No "Errors" button visible
   - Enabled toggle is ON

**Pass/fail + screenshot evidence:**

### Firefox

1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on" and select the candidate XPI.
3. Verify the add-on card appears with:
   - Name "MCP SuperAssistant"
   - Version matching the candidate
   - Internal UUID shown
   - No error messages visible

**Pass/fail + screenshot evidence:**

## Step 2: Verify background service worker

### Chrome

1. In `chrome://extensions`, click "service worker" link on the extension card.
2. Verify the DevTools console shows no errors.
3. Verify the background context is active (not suspended/stopped).

**Pass/fail + console output:**

### Firefox

1. In `about:debugging#/runtime/this-firefox`, click "Inspect" next to the add-on.
2. Verify the console shows no errors.
3. Verify the background script loaded.

**Pass/fail + console output:**

## Step 3: Verify content script activation

For each supported test site, navigate to the chat page and verify:

- The extension's UI injected into the page (sidebar, floating button, or DOM artifact matching the extension's pattern).
- No console errors from the content script.
- The extension correctly identifies this site (site name or icon matches).

### Sites to test

| Site | URL | Expected injection | Pass/fail | Notes |
| --- | --- | --- | --- | --- |
| Z.ai | Chat page | Extension UI visible | | |
| Qwen AI | Chat page | Extension UI visible | | |
| Gemini | `gemini.google.com` | Extension UI visible | | |
| ChatGPT | `chatgpt.com` | Extension UI visible | | |

## Step 4: Connect to MCP server

1. Open the extension's connection/settings panel.
2. Add or select an MCP server endpoint (e.g., `filesystem` server).
3. Click Connect.
4. Verify the connection state changes to "Connected" or "Ready".
5. Verify the tool list populates (tool count > 0).

**Pass/fail + tool count observed:**

## Step 5: Execute a tool manually

1. Write a prompt that triggers a tool call (e.g., "List the files in my home directory" for `filesystem`).
2. Verify the extension shows the tool is available (highlighted or suggested).
3. Click Run (manual execution).
4. Verify the result is inserted into the chat editor.
5. Verify the result content is correct (matches expected tool output).
6. Verify the extension state returns to ready/idle after execution.

**Pass/fail + result description + screenshot before/after:**

## Step 6: Auto-execute a tool

1. Ensure auto-execute is enabled in extension settings.
2. Write a prompt that triggers a tool call.
3. Verify the tool executes automatically (no manual Run click).
4. Verify the tool call executes exactly once (not duplicated).
5. Verify the result is inserted into the chat editor.
6. Verify the host chat application recognized the inserted content.

**Pass/fail + auto-execute observed:**

## Step 7: Test structured failure

1. Connect to a server endpoint that is not running or returns errors.
2. Verify the connection state shows an error (not "Connected" or healthy green).
3. Verify the tool list is empty or shows an error message.
4. Reconnect to a working server.
5. Verify the tool list repopulates correctly.

**Pass/fail + error state observed:**

## Step 8: Test reload behavior

1. Reload the page (F5/Ctrl+R).
2. Verify the extension re-injects its UI within 5 seconds.
3. Verify the connection state is still reflected correctly (reconnect if needed).
4. Verify tool execution still works after reload.

**Pass/fail + reload behavior:**

## Step 9: Test SPA navigation

1. On a SPA site (e.g., ChatGPT, Gemini), navigate to a different route/chat.
2. Verify the extension remounts its UI (no duplicate injection).
3. Verify MCP state is preserved or correctly reset.

**Pass/fail + SPA behavior:**

## Step 10: Optional submission test

Only if the site supports auto-submit and the extension has a submit feature:

1. Enable auto-submit in extension settings.
2. Execute a tool call.
3. Verify the host chat application shows a state transition (message sent, loading indicator, response generated).

**Pass/fail + host state transition observed:**

## Step 11: Repeat for Firefox

Run steps 1–10 against the Firefox XPI, recording the same evidence. Note any differences in behavior.

**Firefox overall pass/fail:**

## Evidence collection summary

| Evidence item | Collected? | Location |
| --- | --- | --- |
| Artifact SHA-256 | | `package-baseline-*.md` |
| Browser version and OS | | This protocol |
| Step-by-step results | | This protocol (per step) |
| Screenshots | | Attached per step |
| Console logs (sanitized) | | Attached per step |
| MCP endpoint used | | This protocol |

## Release gate status

After completing this protocol, update:

- `support-matrix.md`: browser and site rows
- `issue-coverage-ledger.md`: Chrome/Firefox runtime rows
- `STABILIZATION_STATUS.md`: smoke matrix rows
- `known-limitations.md`: any new limitations discovered
