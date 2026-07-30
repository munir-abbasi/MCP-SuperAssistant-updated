# Issue Coverage Ledger

| Issue | Classification | Failure family | Reproduced | First failing boundary | Test/fixture | Disposition | Release blocker | Evidence gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #199 | Confirmed defect | Output schema validation | Yes | Zod outputSchema | `tests/browser-json-schema-validator.test.ts` | Fixed | Yes | Live-site insertion test |
| Discovery Failure | Confirmed defect | Truthful connection state | Yes | `StreamableHttpPlugin.getPrimitives()` | `tests/mcp-client-discovery-state.test.ts` | Fixed | Yes | Live-site error UI handling |
