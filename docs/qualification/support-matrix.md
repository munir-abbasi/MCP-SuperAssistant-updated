# Support Matrix

**Evidence snapshot:** 2026-07-30. **Status:** verified-scoped historical qualification evidence; revalidate before making a current support claim if the relevant source revision, packaged artifact, browser/site behavior, transport implementation, or qualification procedure has changed. See `docs/qualification/README.md`.

| Dimension | Required status values | Qualified in this snapshot |
| --- | --- | --- |
| Browser | Qualified, experimental, unsupported | Chrome (Qualified), Firefox (Qualified) on Linux |
| Platform/site | Qualified, smoke-only, experimental, unsupported | ChatGPT (Qualified), Other sites (Experimental/Unsupported) |
| Transport | Qualified, experimental, unsupported | Streamable HTTP with JSON/SSE (Qualified) |
| MCP protocol version | Tested, compatible-by-inference, unsupported | Tested |
| Artifact | Development-only, packaged, signed/store-distributed | Packaged Chrome and Firefox |
| OS | Tested, smoke-only, untested | Linux (Tested) |

## Experimental / Unsupported Sites
Every other site named in the README or manifest is currently considered **experimental** or **unsupported** until it passes the adapter contract and is explicitly verified.
