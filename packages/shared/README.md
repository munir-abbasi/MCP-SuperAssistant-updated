# Shared Package (`@extension/shared`)

This package contains shared React helpers and TypeScript utilities used across extension packages.

## Contents

- `useStorage` from `lib/hooks/`
- `withSuspense` and `withErrorBoundary` from `lib/hoc/`
- shared utility types such as `ValueOf` from `lib/utils/`

`src/types/toolCall.ts` contains `ToolCall` and `ToolCallMessage`, but the package root does not currently export that file. Treat the root export barrel (`index.mts`) as the public contract.

## Usage

To use the shared code in other packages, add the following to your `package.json`:

```json
{
  "dependencies": {
    "@extension/shared": "workspace:*"
  }
}
```

Then import only names exposed by the root barrel:

```typescript
import { withErrorBoundary } from '@extension/shared';
import type { ValueOf } from '@extension/shared';

type Status = ValueOf<{ ready: 'ready'; waiting: 'waiting' }>;
```

## Purpose

Keep cross-package helpers here only when they are genuinely shared. Protocol/message contracts remain with their owning package unless they are intentionally exported through this package's root barrel.
