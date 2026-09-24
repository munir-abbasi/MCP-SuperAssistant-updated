# UI Package (`@extension/ui`)

Small shared presentation package for extension pages. It owns reusable UI primitives and Tailwind integration; content-script state, hooks, and site-adapter behavior stay in `pages/content/src/`.

## Public API

The package root exports:

- `ToggleButton` — a native-button-compatible theme toggle backed by `exampleThemeStorage`.
- `cn(...inputs)` — class-name composition using `clsx` and `tailwind-merge`.
- `withUI(config)` — adds this package's component files to a Tailwind configuration's content paths.

The export barrels are `index.ts`, `lib/index.ts`, and `lib/components/index.ts`. Read those files before documenting or importing another component; the package does not currently export a general shadcn component set.

## Usage

```tsx
import { ToggleButton, cn } from '@extension/ui';

export function ThemeControl({ className }: { className?: string }) {
  return <ToggleButton className={cn('rounded', className)}>Toggle theme</ToggleButton>;
}
```

## Tailwind Integration

```ts
import { withUI } from '@extension/ui';

export default withUI({
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
});
```

Global styles live in `lib/global.css`. Consumers that need them must import that file from their own entry point.

## Adding a Component

1. Add the implementation under `lib/components/`.
2. Export it from `lib/components/index.ts`.
3. Verify the package type-checks and the consuming page can import it from `@extension/ui`.

Do not document hypothetical components or content-script hooks here. Their implementation/export is the current contract.
