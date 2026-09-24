# Components

React components for the injected UI on AI platform pages.

## Directory Structure

### `sidebar/` — Main Sidebar

Primary interface containing:
- Connection status indicators
- Tool execution panels and controls
- Settings and preferences UI
- Instructions panel (MCP prompt generation)

### `mcpPopover/` — Tool Popover

Tool call detection overlay:
- Tool call detection and display
- Execution progress indicators
- Result formatting
- Auto-execution controls

### `ui/` — Shared Components

Content-local UI primitives and wrappers. The separate `@extension/ui` package currently exports only the primitives documented in `packages/ui/README.md`; inspect its export barrel before importing from it.

### `websites/` — Site-Specific Components

Platform-specific overrides:
- `gemini/` — Google Gemini interface adaptations
- Additional sites as needed

## Integration Patterns

### State Management

```typescript
import { useStores } from '../../hooks/useStores';

export function ConnectionSummary() {
  const { connection } = useStores();
  return <span>{connection.status}</span>;
}
```

`useStores()` returns domain stores (`app`, `connection`, `tools`, `ui`, and `adapters`), not flattened state fields. Use focused selectors from `hooks/useStores.ts` where available.

### Event System

```typescript
import { useEventBus } from '../../hooks/useEventBus';

export function ToolButton({ toolId }: { toolId: string }) {
  const { emit } = useEventBus();
  
  return (
    <button onClick={() => emit('tool:requested', { toolId, source: 'button' })}>
      Execute Tool
    </button>
  );
}
```

### Styling

```typescript
import { cn } from '@extension/ui';

export function StyledComponent() {
  return <button className={cn('p-4', 'shadow-lg')}>Action</button>;
}
```

## Best Practices

1. **Use hooks** — Always use provided hooks for state and plugins
2. **Type safety** — TypeScript interfaces for all props
3. **Error boundaries** — Implement error handling
4. **Performance** — Use `React.memo` and `useMemo` for expensive operations
5. **Accessibility** — ARIA labels and keyboard navigation
