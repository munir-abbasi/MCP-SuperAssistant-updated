import assert from 'node:assert/strict';
import test from 'node:test';

import { extractToolUpdateTools } from '../../pages/content/src/core/tool-update-payload.ts';

test('extracts tools from the typed background tool-update payload', () => {
  const tools = [{ name: 'read_file' }];

  assert.deepEqual(extractToolUpdateTools({ tools }), tools);
});

test('keeps compatibility with legacy array tool-update payloads', () => {
  const tools = [{ name: 'list_directory' }];

  assert.deepEqual(extractToolUpdateTools(tools), tools);
});

test('treats malformed tool-update payloads as an empty tool list', () => {
  assert.deepEqual(extractToolUpdateTools({ tools: 'not-an-array' }), []);
  assert.deepEqual(extractToolUpdateTools(null), []);
});
