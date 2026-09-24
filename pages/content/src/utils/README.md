# Content Utility Modules

The public utility barrel is `index.ts`. It currently re-exports the DOM helpers from `dom.ts`, asynchronous helpers from `async.ts`, and miscellaneous helpers from `misc.ts`.

## Public helpers

- DOM: `createElement`, `waitForElement`, `injectCSS`, and `observeChanges`.
- Async: `debounce` and `throttle`.
- Miscellaneous: `getUniqueId` and the other exports currently present in `misc.ts`.

Read `index.ts` and the owning module before relying on a helper. Files such as `storage.ts`, `mcpHandler.ts`, and `toolExecutionStorage.ts` exist in this directory but are not automatically part of the public barrel contract.

## Usage

```typescript
import { debounce, getUniqueId, waitForElement } from '../utils';

const requestId = getUniqueId();
const findEditor = debounce(() => waitForElement('.editor'), 100);
```

The exact argument and return types are defined by the source modules. Do not document helpers that are not exported by the barrel as public utilities.

## Maintenance

Keep each helper focused and update this README only when the public export surface or ownership boundary changes. For behavior changes, inspect callers and run the narrow content/type verification selected in `AGENT_GUIDE.md`.
