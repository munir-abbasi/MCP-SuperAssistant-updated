# Zustand State Stores

The content script keeps shared state in six domain stores. Their `*.store.ts` implementations and exported TypeScript types are the executable contract; this README is the local ownership map, not a duplicated field/action reference.

## Owners

| Store | Owns |
|---|---|
| `app.store.ts` | Application initialization, current site/host, and global settings |
| `connection.store.ts` | Server configuration, the five-state connection lifecycle, timestamps, attempts, and connection diagnostics |
| `tool.store.ts` | Available/detected tools, operation-correlated executions, delivery state, and tool enablement |
| `adapter.store.ts` | Registered plugins, active adapter, capabilities, lifecycle, and adapter diagnostics |
| `ui.store.ts` | Sidebar state, user preferences, notifications, theme, modal/loading state, and MCP-facing UI state |
| `config.store.ts` | Feature flags, configuration freshness/loading, user properties/segments, and notification configuration/history |

`index.ts` exports the six stores and `initializeAllStores()`. Update this table only when a store's ownership changes; read the owning implementation for exact fields and actions.

## Usage

Subscribe to the smallest required slice:

```typescript
import { useConnectionStore } from './connection.store';

const status = useConnectionStore(state => state.status);
```

Use `useShallow` when selecting an object of several fields. Avoid subscribing a component to an entire store when one slice is sufficient.

## Cross-Boundary State

The typed event bus carries observable cross-component transitions where the implementation explicitly emits and subscribes. Stores do not synchronize automatically merely because both use the event system. Inspect the owning store and event handler before relying on an event/state relationship.

Do not reference one store directly from another when an existing typed event or orchestration owner already carries the transition. New shared state belongs in the narrowest existing domain store; create another store only when no current owner can hold it coherently.

## Initialization and Observation

`initializeAllStores()` establishes the current store instances and initializes configuration-derived user properties. Development observation surfaces are documented in `ARCHITECTURE.md`; do not assume a store is exposed through a browser global unless that map says so.

## Verification

For a store contract change:

1. Inspect the store implementation and all selectors/actions that consume the changed field.
2. Inspect typed event producers/consumers only when the state crosses that interface.
3. Run the narrow content/type checks selected by `AGENT_GUIDE.md`.
4. Update this ownership table only if the domain boundary changed.
