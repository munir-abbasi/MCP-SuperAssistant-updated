# React Hooks

Integration layer between Zustand stores, the event bus, and React components.

## Hook Categories

### Store Hooks (`useStores.ts`)

Optimized access to Zustand stores with automatic re-rendering.

#### App Store
- `useAppInitialization()` — App init state and methods
- `useGlobalSettings()` — Settings management
- `useCurrentSite()` — Site and hostname tracking

#### Connection Store
- `useConnectionStatus()` — MCP connection status
- `useServerConfig()` — Server configuration
- `useConnectionHealth()` — Health metrics

#### Tool Store
- `useAvailableTools()` — Available MCP tools
- `useDetectedTools()` — Tools detected on page
- `useToolExecution()` — Execution tracking
- `useToolActions()` — Execution methods

#### UI Store
- `useSidebar()` — Sidebar state and controls
- `useSidebarState()` — Detailed sidebar state
- `useTheme()` — Theme management
- `useNotifications()` — Notification system
- `useModal()` — Modal dialog management
- `useUserPreferences()` — User preferences

#### Adapter Store
- `useActiveAdapter()` — Current adapter info
- `useRegisteredAdapters()` — All registered adapters
- `useAdapterStatus()` — Adapter status monitoring

### Event Hooks (`useEventBus.ts`)

Type-safe integration with the event bus.

- `useEventListener<K>()` — Listen to events with auto-cleanup
- `useEventEmitter()` — Emit events with type safety
- `useEventOnce<K>()` — One-time event listening
- `useEventSync<T, K>()` — Sync state with events
- `useConditionalEventListener<K>()` — Conditional listening
- `useMultipleEventListeners()` — Multiple subscriptions

### Adapter Hooks (`useAdapter.ts`)

High-level APIs for the plugin system.

#### `useCurrentAdapter()`

```typescript
const {
  activeAdapterName,    // Name of active adapter
  plugin,              // Adapter instance
  status,              // Current status
  error,               // Error state
  capabilities,        // Available capabilities
  insertText,          // Text insertion method
  submitForm,          // Form submission method
  attachFile,          // File attachment method
  hasCapability,       // Capability checker
  isReady              // Ready state
} = useCurrentAdapter();
```

#### `useAdapterManagement()`

```typescript
const {
  adapters,                    // All registered adapters
  registerPlugin,              // Register new adapter
  unregisterPlugin,            // Unregister adapter
  activateAdapter,             // Activate specific adapter
  deactivateCurrentAdapter,    // Deactivate current
  getAdapterForHostname       // Find adapter for hostname
} = useAdapterManagement();
```

#### `useAdapterCapabilities()`

```typescript
const {
  availableCapabilities,       // Array of capabilities
  supportsTextInsertion,       // Boolean checks
  supportsFormSubmission,
  supportsFileUpload,
  supportsUrlNavigation,
  supportsDomManipulation,
  hasAnyCapability
} = useAdapterCapabilities();
```

#### `useAutoAdapterSwitching()`

```typescript
const { enabled, activeAdapterName } = useAutoAdapterSwitching(true);
```

### Utility Hooks

- `useShadowDomStyles.ts` — Shadow DOM styling utilities

## Usage Examples

### Basic Component Integration

```typescript
import { useCurrentAdapter, useEventListener } from '@src/hooks';

function ToolButtons() {
  const { insertText, submitForm, isReady } = useCurrentAdapter();
  
  useEventListener('tool:execution-completed', (data) => {
    console.log('Tool completed:', data.execution.toolName);
  });
  
  return (
    <div>
      <button onClick={() => insertText('Hello')} disabled={!isReady}>
        Insert Text
      </button>
      <button onClick={submitForm} disabled={!isReady}>
        Submit Form
      </button>
    </div>
  );
}
```

### Event-Driven Components

```typescript
import { useEventListener, useEventEmitter } from '@src/hooks';

function EventMonitor() {
  const [events, setEvents] = useState([]);
  const emit = useEventEmitter();
  
  useEventListener('tool:execution-started', (data) => {
    setEvents(prev => [...prev, { type: 'started', ...data }]);
  });
  
  useEventListener('tool:execution-completed', (data) => {
    setEvents(prev => [...prev, { type: 'completed', ...data }]);
  });
  
  return (
    <div>
      <button onClick={() => emit('tool:execution-started', { toolName: 'test', callId: '1' })}>
        Trigger Test
      </button>
      <ul>
        {events.map((e, i) => <li key={i}>{e.type}: {e.toolName}</li>)}
      </ul>
    </div>
  );
}
```

## Performance

### Shallow Comparison

All store hooks use `useShallow` for performance:

```typescript
export const useGlobalSettings = () =>
  useAppStore(useShallow((state) => ({
    settings: state.globalSettings,
    updateSettings: state.updateSettings
  })));
```

### Selective Subscriptions

```typescript
// Only re-renders when sidebar visibility changes
const { isVisible } = useSidebarState();

// Only re-renders when connection status changes
const { status } = useConnectionStatus();
```

### Auto-Cleanup

Event hooks automatically clean up on unmount:

```typescript
useEventListener('some:event', callback); // Cleaned up automatically
```

## Best Practices

1. **Use specific hooks** — Prefer `useSidebarState()` over `useStores()`
2. **Handle loading states** — Always check `isReady` before operations
3. **Type safety** — Event payloads are fully typed
4. **Dependencies** — Pass dependency arrays to event hooks when callbacks change
