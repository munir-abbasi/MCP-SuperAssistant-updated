# Plugin System

Modular adapter architecture that provides site-specific behavior for each AI platform.

## How It Works

The plugin system matches adapters to websites by hostname, manages their lifecycle, and provides capability-based feature detection. When the content script loads on a supported site, the registry activates the appropriate adapter.

```
PluginRegistry → matches hostname → activates adapter → adapter provides capabilities
```

## Core Components

### `plugin-registry.ts` — PluginRegistry

Central hub for plugin management:

```typescript
class PluginRegistry {
  async initialize(context: PluginContext): Promise<void>
  async register(plugin: AdapterPlugin, config?: AdapterConfig): Promise<void>
  async activatePluginForHostname(hostname: string): Promise<void>
  async cleanup(): Promise<void>
  getActivePlugin(): AdapterPlugin | null
  getDebugInfo(): object
}
```

### `plugin-types.ts` — Type Definitions

TypeScript interfaces for the plugin system:
- `AdapterPlugin` — Core plugin contract
- `AdapterConfig` — Plugin configuration schema
- `PluginContext` — Runtime context for plugins
- `AdapterCapability` — Available plugin capabilities
- `PluginRegistration` — Internal registry structure

### `base.adapter.ts` — BaseAdapterPlugin

Abstract base class providing:
- Lifecycle management (initialize → activate → deactivate → cleanup)
- Status tracking and error handling
- Plugin context integration
- Event handler interfaces

### `plugin-context.ts` — Context Provider

Factory for creating plugin contexts:
- Store access (Zustand stores)
- Event bus (type-safe communication)
- Utilities (DOM helpers)
- Chrome APIs (extension access)
- Logger (structured logging)

## Architecture

```
PluginRegistry
  ├─ Plugin Types (contracts)
  ├─ Plugin Context (factory)
  ├─ SidebarPlugin (eager — universal sidebar)
  ├─ RemoteConfigPlugin (eager — content-side config plugin)
  └─ Lazy adapter factories — instantiated only when a hostname matches
```

The registry is the implementation source for registered factories. The adapters README describes the local adapter contract; runtime qualification is a separate per-site verification. `DefaultAdapter` and `ExampleForumAdapter` remain source-only reference implementations unless the registry says otherwise.

`RemoteConfigPlugin` still emits `remote-config:*` messages/events on the content side. The former Firebase/background handlers are absent from the current background implementation, so this module must not be described as a functioning Firebase Remote Config backend integration.

## Usage

### Initialize the Plugin System

```typescript
import { initializePluginRegistry } from '@src/plugins';
await initializePluginRegistry();
```

### Use with React Hooks

```typescript
import { useCurrentAdapter } from '@src/hooks';

function MyComponent() {
  const { insertText, submitForm, capabilities, isReady } = useCurrentAdapter();
  
  return (
    <button onClick={() => insertText('Hello')} disabled={!isReady}>
      Insert Text
    </button>
  );
}
```

### Create a Custom Adapter

```typescript
import { BaseAdapterPlugin } from '@src/plugins';

export class MySiteAdapter extends BaseAdapterPlugin {
  readonly name = 'MySiteAdapter';
  readonly version = '1.0.0';
  readonly hostnames = ['mysite.com'];
  readonly capabilities = ['text-insertion', 'form-submission'];
  
  async insertText(text: string): Promise<boolean> {
    const el = document.querySelector('.chat-input');
    if (!el) return false;
    (el as HTMLTextAreaElement).value = text;
    return true;
  }
  
  async submitForm(): Promise<boolean> {
    const btn = document.querySelector('.send-btn');
    if (!btn) return false;
    (btn as HTMLButtonElement).click();
    return true;
  }
}
```

## Events

The plugin system emits lifecycle events:

```typescript
'plugin:registry-initialized'
'plugin:registered'
'plugin:activation-requested'
'adapter:activated'
'adapter:deactivated'
'adapter:error'
```

## Debug

```javascript
// Browser console
window.__pluginSystem.getRegistry().getDebugInfo();
window.__pluginSystem.getRegistry().getActivePlugin();
```

## Best Practices

1. **Error handling** — Wrap adapter operations in try-catch; return `false` on failure, don't throw
2. **Event emission** — Emit events for important operations
3. **Resource cleanup** — Implement `cleanupPlugin()` properly
4. **Type safety** — Use TypeScript interfaces, avoid `any`
5. **Performance** — Cache DOM queries, minimize re-renders

## Directory Structure

```
plugins/
├── index.ts              # Public API exports
├── plugin-registry.ts    # Registry + lazy factory management
├── plugin-types.ts       # Type definitions
├── plugin-context.ts     # Context provider
├── base.adapter.ts       # Base adapter class
├── sidebar.plugin.ts     # Universal sidebar plugin
├── remote-config.plugin.ts  # Content-side remote-config plugin; backend handlers absent
└── adapters/
    ├── default.adapter.ts     # Present but not factory-registered
    ├── chatgpt.adapter.ts     # ChatGPT
    ├── gemini.adapter.ts      # Google Gemini
    ├── perplexity.adapter.ts  # Perplexity
    ├── grok.adapter.ts        # Grok
    ├── aistudio.adapter.ts    # Google AI Studio
    ├── openrouter.adapter.ts  # OpenRouter
    ├── deepseek.adapter.ts    # DeepSeek
    ├── t3chat.adapter.ts      # T3 Chat
    ├── ghcopilot.adapter.ts   # GitHub Copilot
    ├── mistral.adapter.ts     # Mistral AI
    ├── kimi.adapter.ts        # Kimi
    ├── qwenchat.adapter.ts    # Qwen Chat
    ├── z.adapter.ts           # Z Chat
    └── example-forum.adapter.ts  # Demo/reference; unregistered
```
