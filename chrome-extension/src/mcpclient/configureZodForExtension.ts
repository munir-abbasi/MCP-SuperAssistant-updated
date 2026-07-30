import { config as configureZod } from 'zod/v4';

// Zod 4 captures its JIT setting when schemas are created. This module must be
// evaluated before any runtime import from the MCP SDK.
configureZod({ jitless: true });
