# Diagnostic playbook

## Evidence matrix

Record one row per controlled run.

| Commit/build | Browser/version | Extension source | Site | Transport | Endpoint | Proxy/SDK | Payload variant | Connected | Tool count | First error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |

## Symptom routing

| Symptom | First checks | Likely boundary |
| --- | --- | --- |
| Extension absent on one site | manifest match pattern, content-script console, DOM adapter activation | manifest/content script/site adapter |
| Cannot connect | endpoint/transport match, proxy listener, CORS, mixed content, network log | proxy/transport/browser policy |
| Connected, zero tools | raw `tools/list`, SDK error, transport catch path, cache, tools update event | SDK/transport/normalization |
| Tools visible, calls fail | request name/arguments, server error, transport health, result schema | call path/server/result handling |
| Calls work, result not inserted | background messaging, content store, adapter selectors/editor API | messaging/site adapter |
| Chrome works, Firefox fails | generated manifests, background context, CSP, WebExtension API differences | browser compatibility/build |
| Local build works, store build fails | version, package contents, sourcemaps/minification, stale profile/cache | packaging/release state |

## Protocol checks

- Capture initialize negotiation and server capabilities before assuming `tools/list` must run.
- Use the required `Accept` header and session/protocol headers for the selected MCP transport/version.
- Preserve JSON-RPC IDs and distinguish HTTP success from JSON-RPC success.
- Compare the exact response received by the browser with the direct request; proxy middleware may transform it.
- Minimize a failing response structurally. Do not remove several fields at once and attribute causality to one.

## Browser checks

- Use an unpacked development build from the exact commit under test.
- Disable the store version to avoid duplicate content scripts.
- Inspect the extension background context, not only the page console.
- Keep DevTools open where needed to observe an ephemeral MV3 worker, but also test worker suspension/restart.
- Confirm which built artifact the browser loaded and reload it after each build.
- Clear extension state only as a named experimental step; state loss can hide cache/migration bugs.

## Differential fixture strategy

Start with one known-good tool and one failing tool. Vary one dimension per fixture:

- no `outputSchema` versus simple `outputSchema`
- `$schema` URI present versus absent
- `required` present versus absent
- `additionalProperties: false` versus omitted
- valid output schema versus deliberately invalid schema
- optional `title`, `annotations`, `execution`, and unknown extension metadata
- one failing tool among valid tools

Assert both discovery behavior and error containment. A durable client should not silently convert a parse exception into a misleading healthy/zero-tools state.

## Completion threshold

A hypothesis becomes a root cause only when:

1. the original failure is reproducible;
2. a single controlled change removes it;
3. reverting that change restores it, where practical;
4. the fix passes a regression test at the responsible boundary; and
5. manual browser behavior matches the automated result.
