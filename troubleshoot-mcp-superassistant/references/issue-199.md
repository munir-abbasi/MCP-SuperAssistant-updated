# Issue #199: zero tools with `outputSchema`

Source: `srbhptl39/MCP-SuperAssistant/issues/199`, opened 2026-05-20. Re-read the live issue before acting.

## Reported observations

- Fedora Linux; Chrome and Firefox; Streamable HTTP at `http://localhost:3006/mcp`.
- MCP Inspector and a direct `tools/list` request returned tools.
- The extension reported connected but `0 of 0 tools enabled` and no instructions.
- The background console printed schema-compilation errors.
- A forwarding sanitizer that removed only `outputSchema` from each tool made tools and instructions appear immediately.
- The issue remains open and has only an automated acknowledgment in the inspected state.

## What this establishes

- The tested server/proxy path could return tools outside the extension.
- Tool metadata containing `outputSchema` is strongly associated with the failure.
- The earliest suspect boundary is extension-side SDK parsing/validation before or during `client.listTools()`, not the final sidebar renderer.
- Removing `outputSchema` is a useful diagnostic workaround.

## What it does not establish

- It does not prove AJV is directly imported or invoked by extension source.
- It does not identify the exact SDK/Zod function, schema dialect feature, or dependency interaction.
- It does not prove every valid `outputSchema` fails.
- It does not prove Chrome and Firefox share an identical root cause merely because both show the symptom.
- It does not justify permanently stripping a protocol-valid field without testing downstream semantics.

## Required reproduction fixtures

Build a deterministic `tools/list` fixture from the report and test at least:

1. the tool without `outputSchema`;
2. the exact reported `outputSchema`;
3. a minimal `{ "type": "object" }` output schema;
4. `$schema`, `required`, and `additionalProperties` varied independently;
5. multiple tools with only one containing the suspect schema;
6. current SDK behavior versus any proposed pin/upgrade.

Capture the full error and stack in a development bundle with sourcemaps. Locate whether failure occurs in the SDK response schema, Zod JSON-schema conversion/validation, another bundled validator, or application code.

## Fix acceptance criteria

- A protocol-valid tool with `outputSchema` is discoverable.
- One unsupported or malformed tool does not silently turn a valid tool set into a misleading connected/zero-tools state, subject to SDK/API constraints.
- Existing tools without `outputSchema` remain compatible.
- `inputSchema` and tool calls still behave correctly.
- Streamable HTTP, SSE, and WebSocket discovery are checked when shared client code changes.
- Both Chrome and Firefox pass real extension verification.
- No `unsafe-eval`, CSP weakening, indiscriminate validation disablement, or undocumented metadata loss is introduced.
- The regression test fails on the old behavior and passes with the fix.
