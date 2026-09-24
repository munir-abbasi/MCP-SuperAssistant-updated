# Adapter Plugins

Concrete implementations of the `AdapterPlugin` interface, tailored to specific AI platforms.

## Current Adapters

The following site adapters are currently registered as **lazy factories** in `plugin-registry.ts` and are instantiated only when their hostname matches. Registration does not imply runtime qualification; see `docs/qualification/support-matrix.md` for verified support status.

| Adapter | File | Hostnames | Capabilities |
|---------|------|-----------|-------------|
| ChatGPTAdapter | `chatgpt.adapter.ts` | `['chatgpt.com']` | text-insertion, form-submission, file-attachment |
| GeminiAdapter | `gemini.adapter.ts` | `['gemini.google.com']` | text-insertion, form-submission, file-attachment |
| PerplexityAdapter | `perplexity.adapter.ts` | `['perplexity.ai']` | text-insertion, form-submission, file-attachment |
| GrokAdapter | `grok.adapter.ts` | `['grok.com', 'x.com']` | text-insertion, form-submission, file-attachment |
| AIStudioAdapter | `aistudio.adapter.ts` | `['aistudio.google.com']` | text-insertion, form-submission, file-attachment |
| OpenRouterAdapter | `openrouter.adapter.ts` | `['openrouter.ai']` | text-insertion, form-submission, file-attachment |
| DeepSeekAdapter | `deepseek.adapter.ts` | `['chat.deepseek.com']` | text-insertion, form-submission, file-attachment |
| T3ChatAdapter | `t3chat.adapter.ts` | `['t3.chat']` | text-insertion, form-submission, file-attachment |
| GitHubCopilotAdapter | `ghcopilot.adapter.ts` | `['github.com']` | text-insertion, form-submission |
| MistralAdapter | `mistral.adapter.ts` | `['chat.mistral.ai']` | text-insertion, form-submission, file-attachment |
| KimiAdapter | `kimi.adapter.ts` | `['kimi.com']` | text-insertion, form-submission, file-attachment |
| QwenAdapter | `qwenchat.adapter.ts` | `['chat.qwen.ai']` | text-insertion, form-submission, file-attachment |
| ZAdapter | `z.adapter.ts` | `['z.ai']` | text-insertion, form-submission, file-attachment |

### Present but not registered

- `DefaultAdapter` (`default.adapter.ts`) exists and declares wildcard behavior, but the current registry does not register it as a factory or active fallback.
- `ExampleForumAdapter` (`example-forum.adapter.ts`) is a demo/reference implementation; its import/registration is commented out.

### Key Adapter Details

#### GeminiAdapter
Advanced adapter for Google Gemini. Features drag-drop file attachment simulation, custom chat input handling, and SPA navigation tracking.

#### ChatGPTAdapter
Specialized for OpenAI's ChatGPT interface with chat input, form submission, and file attachment support.

### `base.adapter.ts` — BaseAdapterPlugin

Abstract base class providing common functionality for all adapters:
- Lifecycle management (initialize, activate, deactivate, cleanup)
- Status tracking and error handling
- Plugin context integration
- Event handler interfaces
- Conservative text-insertion verification: the base implementation can confirm expected text in the
  currently focused editable element, but returns `unavailable` when it cannot prove that page state.
  Site adapters may override it when they can observe their exact insertion target and may return
  `mismatch` only from such target-specific evidence.

## Adapter Interface

```typescript
interface AdapterPlugin {
  readonly name: string;
  readonly version: string;
  readonly hostnames: string[] | RegExp[];
  readonly capabilities: AdapterCapability[];
  
  // Lifecycle
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  cleanup(): Promise<void>;
  
  // Core functionality
  insertText(text: string): Promise<boolean>;
  verifyTextInsertion?(text: string): Promise<'verified' | 'mismatch' | 'unavailable'>;
  submitForm(): Promise<boolean>;
  attachFile?(file: File): Promise<boolean>;
  
  // Status
  isSupported(): boolean;
  getStatus(): AdapterStatus;
}
```

## Capabilities

| Capability | Description |
|-----------|-------------|
| `text-insertion` | Can insert text into page elements |
| `form-submission` | Can submit forms |
| `file-attachment` | Can attach files to inputs |
| `url-navigation` | Can navigate to different URLs |
| `element-selection` | Can select specific DOM elements |
| `screenshot-capture` | Can capture screenshots |
| `dom-manipulation` | Can manipulate DOM elements |

## Creating a New Adapter

### 1. Create the Adapter File

```typescript
// my-site.adapter.ts
import { BaseAdapterPlugin } from '../base.adapter';
import type { AdapterCapability } from '../plugin-types';

export class MySiteAdapter extends BaseAdapterPlugin {
  readonly name = 'my-site-adapter';
  readonly version = '1.0.0';
  readonly hostnames = ['my-site.com', 'www.my-site.com'];
  readonly capabilities: AdapterCapability[] = [
    'text-insertion', 
    'form-submission',
    'url-navigation'
  ];

  async insertText(text: string): Promise<boolean> {
    const el = document.querySelector('.my-site-textarea');
    if (!el) return false;
    (el as HTMLTextAreaElement).value = text;
    return true;
  }

  async submitForm(): Promise<boolean> {
    const btn = document.querySelector('.my-site-submit');
    if (!btn) return false;
    (btn as HTMLButtonElement).click();
    return true;
  }

  protected async initializePlugin(): Promise<void> {
    this.context.logger.info('Initializing MySiteAdapter...');
  }

  protected async activatePlugin(): Promise<void> {
    this.context.logger.info('Activating MySiteAdapter...');
  }

  protected async deactivatePlugin(): Promise<void> {
    this.context.logger.info('Deactivating MySiteAdapter...');
  }

  protected async cleanupPlugin(): Promise<void> {
    this.context.logger.info('Cleaning up MySiteAdapter...');
  }
}
```

### 2. Register the Adapter

In `plugin-registry.ts`:

```typescript
import { MySiteAdapter } from './adapters/my-site.adapter';

private async registerBuiltInAdapters(): Promise<void> {
  this.registerAdapterFactory({
    name: 'my-site-adapter',
    version: '1.0.0',
    type: 'website-adapter',
    hostnames: ['my-site.com', 'www.my-site.com'],
    capabilities: ['text-insertion', 'form-submission', 'url-navigation'],
    create: () => new MySiteAdapter(),
    config: {
      id: 'my-site-adapter',
      name: 'My Site Adapter',
      description: 'Specialized adapter for My Site',
      version: '1.0.0',
      enabled: true,
      priority: 5,
      settings: {},
    },
  });
}
```

### 3. Export the Adapter

In `plugins/index.ts`:

```typescript
export { MySiteAdapter } from './adapters/my-site.adapter';
```

## Best Practices

### Specific Hostnames

Use specific hostname patterns to avoid conflicts:
```typescript
readonly hostnames = ['example.com', 'www.example.com'];
```

### Defensive Programming

Always check for element existence:
```typescript
const element = document.querySelector('.target');
if (!element) {
  this.context.logger.warn('Target element not found');
  return false;
}
```

### Event Emission

Emit events for tracking:
```typescript
this.context.eventBus.emit('tool:execution-completed', {
  execution: {
    id: this.generateId(),
    toolName: 'insertText',
    parameters: { text },
    result: { success: true },
    timestamp: Date.now(),
    status: 'success'
  }
});
```

### Error Handling

Use try-catch and return false (don't throw):
```typescript
try {
  // Adapter logic
  return true;
} catch (error) {
  this.context.logger.error('Operation failed:', error);
  return false;
}
```

### Matching Priority

For registered website adapters, hostname matching is scored using the matched hostname-pattern length plus the configured numeric priority. Prefer specific hostnames and avoid relying on priority to compensate for an overly broad hostname pattern.

## React Hook Integration

```typescript
import { useCurrentAdapter } from '../hooks';

function MyComponent() {
  const { insertText, submitForm, hasCapability } = useCurrentAdapter();
  
  return (
    <div>
      <button onClick={() => insertText('Hello')}>Insert Text</button>
      <button onClick={submitForm} disabled={!hasCapability('form-submission')}>
        Submit
      </button>
    </div>
  );
}
```

## Debugging

```javascript
// Browser console
window.__pluginSystem.getRegistry().getDebugInfo();
window.__pluginSystem.getRegistry().getActivePlugin();
```

## Manual Testing

1. Load the extension on the target website
2. Check console for adapter activation logs
3. Test text insertion and form submission
4. Verify event emission in dev tools
