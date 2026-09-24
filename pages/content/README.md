# Content Scripts

Core functionality for the MCP SuperAssistant Chrome extension, injected into AI platform pages.

## What It Does

- Injects MCP integration into supported websites
- Manages site-specific adapters
- Handles tool execution and result insertion
- Provides the plugin system architecture

## Source Structure

```
src/
├── plugins/           Adapter system (plugin registry + adapters)
├── components/        React UI (sidebar, popover, site overrides)
├── stores/            Zustand state management
├── events/            Typed event bus
├── hooks/             React hooks
├── core/              Initialization + architectural services
├── render_prescript/  JSONL function call detection
├── services/          Automation services
├── utils/             Helper functions
└── types/             TypeScript definitions
```

## Key Documentation

- [`src/plugins/README.md`](src/plugins/README.md) — Plugin system
- [`src/plugins/adapters/README.md`](src/plugins/adapters/README.md) — Adapter development
- [`src/stores/README.md`](src/stores/README.md) — State management
- [`src/hooks/README.md`](src/hooks/README.md) — React hooks
- [`src/events/README.md`](src/events/README.md) — Event system

## Adding New Site Support

1. Create an adapter extending `BaseAdapterPlugin`
2. Register it in `plugin-registry.ts`
3. Test on the target site
4. Document in the adapters README

## Commands

```bash
pnpm type-check    # Type checking
pnpm lint          # Linting
pnpm build         # Build extension
```
