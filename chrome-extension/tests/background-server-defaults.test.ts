import assert from 'node:assert/strict';
import test from 'node:test';

import { getDefaultServerUrlForConnectionType } from '../src/background/server-defaults.ts';

test('uses the streamable HTTP default URL for streamable-http connections', () => {
  assert.equal(getDefaultServerUrlForConnectionType('streamable-http'), 'http://localhost:3006');
});

test('keeps existing defaults for SSE and WebSocket connections', () => {
  assert.equal(getDefaultServerUrlForConnectionType('sse'), 'http://localhost:3006/sse');
  assert.equal(getDefaultServerUrlForConnectionType('websocket'), 'ws://localhost:3006/message');
});
