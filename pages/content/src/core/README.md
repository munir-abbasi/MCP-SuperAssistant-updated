# Core Module

Initialization orchestrator and architectural services for the content script.

## Components

### `main-initializer.ts` — Application Initializer

Central orchestrator for content-side application initialization:

```typescript
import { applicationInit, applicationCleanup } from './core/main-initializer';

await applicationInit();    // Initialize everything
await applicationCleanup(); // Clean up on unload
```

`applicationInit()` currently orchestrates these top-level steps in order:

1. Core services
2. Plugin system
3. Sidebar plugin activation
4. Application state and initial site-adapter activation
5. Analytics listeners/session tracking

Within the core-services step, `initializeCoreServices()` performs environment/debug setup, event-bus initialization, architectural service initialization, global event handlers, and store initialization. The numbered comments inside that function describe its local setup order; they are not a formal eight-phase system architecture.

`pages/content/src/index.ts` owns additional entry-point work around this function, including early renderer initialization and later service initialization.

### `circuit-breaker.ts` — Circuit Breaker

Prevents cascading failures by monitoring failure rates and temporarily disabling operations.

```typescript
await circuitBreaker.execute(async () => {
  await riskyOperation();
}, 'operation-name');
```

**Configuration:**
- `failureThreshold` — Failures before opening (default: 5)
- `resetTimeout` — Time before retry (default: 60s)
- `monitoringWindow` — Failure counting window (default: 5min)

### `error-handler.ts` — Global Error Handler

Centralized error handling with pattern detection and statistics.

```typescript
const errorStats = globalErrorHandler.getErrorStats();
console.log('Total errors:', errorStats.totalErrors);
console.log('By component:', errorStats.errorsByComponent);
```

### `performance.ts` — Performance Monitor

Tracks timing, memory usage, and slow operations.

```typescript
// Time an operation
await performanceMonitor.time('my-operation', async () => {
  await doWork();
});

// Mark and measure
performanceMonitor.mark('start');
// ... work ...
performanceMonitor.measure('duration', 'start');
```

### `context-bridge.ts` — Context Bridge

Handles Chrome extension cross-context communication between content script, background, popup, and options.

### `ui-initializer.ts` — UI Initializer

Utilities for mounting React applications:

```typescript
import { setupPopupApp } from './core/ui-initializer';
await setupPopupApp(PopupAppComponent);
```

## Debug Utilities

In development mode, exposed on `window._appDebug`:

```typescript
window._appDebug.stores.app.getState()
window._appDebug.services.performanceMonitor.getStats()
window._appDebug.getStats()
window._appDebug.clearData()
```

## Initialization Status

```typescript
import { initializationUtils } from './core/main-initializer';

const status = initializationUtils.getStatus();
// { isInitialized, initializationTime, errorCount, performanceStats }

await initializationUtils.forceReinit(); // Dev only
```

## Error Recovery

The system implements automatic recovery strategies:
- **Page Reload** — For extension context invalidation
- **Component Reset** — For UI component failures
- **Fallback Mode** — For plugin system failures

## Migration

The legacy `initializer.ts` delegates to `main-initializer.ts`:

```typescript
// Legacy (still works)
import { initializeApp } from './initializer';

// Recommended
import { applicationInit } from './core/main-initializer';
```
