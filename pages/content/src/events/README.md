# Events Module

Typed event bus for decoupled communication between application components.

## Components

### `event-bus.ts` — TypedEventBus

Custom event emitter supporting typed events, wildcard listeners, event history, and error handling. Singleton instance used throughout the application.

### `event-types.ts` — EventMap

Interface mapping event names to their payload types. Includes callback types and unsubscribe functions.

### `event-handlers.ts` — Global Handlers

System-wide event listeners for unhandled errors, site changes, etc. Provides `initializeGlobalEventHandlers()` and `cleanupGlobalEventHandlers()`.

### `event-system.ts` — Orchestrator

Sets up and tears down the event system. Calls `initializeEventSystem()` and `cleanupEventSystem()`.

## Usage

### Emitting Events

```typescript
import { eventBus } from './event-bus';

eventBus.emit('app:initialized', { version: '1.0.0', timestamp: Date.now() });
```

### Subscribing

```typescript
// Specific event
const unsub = eventBus.on('app:initialized', (data) => {
  console.log('App initialized:', data.version);
});

// One-time listener
eventBus.once('app:shutdown', (data) => {
  console.log('Shutdown reason:', data.reason);
});

// Wildcard (all events)
const unsubAll = eventBus.onWildcard((payload) => {
  console.log(`[${payload.event}]`, payload.data);
});

// Cleanup
unsub();
unsubAll();
```

### React Integration

```typescript
import { useEventBus } from '../hooks/useEventBus';

function MyComponent() {
  const { emit, on, off } = useEventBus();
  
  useEffect(() => {
    const unsubscribe = on('adapter:switched', (data) => {
      console.log('Adapter changed:', data.toAdapter);
    });
    return unsubscribe;
  }, [on]);
  
  return <button onClick={() => emit('ui:button-clicked', { buttonId: 'test' })}>
    Click me
  </button>;
}
```

## Event Namespaces

| Namespace | Purpose |
|-----------|---------|
| `app:*` | Application lifecycle |
| `connection:*` | MCP connection |
| `tool:*` | Tool operations |
| `adapter:*` | Plugin system |
| `plugin:*` | Plugin lifecycle |
| `ui:*` | Interface |
| `sidebar:*` | Sidebar control |
| `error:*` | Error handling |
| `feature-flags:*` | Remote config |
| `remote-config:*` | Config sync |

## System Initialization

```typescript
import { initializeEventSystem } from './events/event-system';

async function startApp() {
  await initializeEventSystem();
  // ... other initializations
}
```
