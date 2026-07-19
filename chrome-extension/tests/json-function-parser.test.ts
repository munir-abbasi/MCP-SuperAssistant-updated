import assert from 'node:assert/strict';
import test from 'node:test';

(globalThis as unknown as { window: { location: { href: string } } }).window = {
  location: { href: 'https://chat.qwen.ai/' },
};

const parser = await import('../../pages/content/src/render_prescript/src/parser/jsonFunctionParser.ts');
const config = await import('../../pages/content/src/render_prescript/src/core/config.ts');

test('extracts JSON function info from Qwen-style polluted compact JSONL', () => {
  const content =
    'Rendered wrapper text {"type":"function_call_start","name":"list_directory","call_id":1} ' +
    '{"type":"description","text":"List the current directory"} ' +
    '{"type":"parameter","key":"path","value":"."} ' +
    '{"type":"function_call_end","call_id":1} trailing UI text';

  assert.deepEqual(parser.extractJSONFunctionInfo(content), {
    functionName: 'list_directory',
    callId: '1',
    description: 'List the current directory',
  });
  assert.deepEqual(parser.extractJSONParameters(content), { path: '.' });
});

test('preserves streaming fallback extraction for incomplete JSON function starts', () => {
  const content = 'jsonl {"type":"function_call_start","name":"read_file","call_id":2';

  assert.deepEqual(parser.extractJSONFunctionInfo(content), {
    functionName: 'read_file',
    callId: '2',
    description: null,
  });
});

test('extracts partial JSON function info with polluted text before the opening brace', () => {
  const content = 'Please execute this call: {"type":"function_call_start","name":"list_files","call_id":3';

  assert.deepEqual(parser.extractJSONFunctionInfo(content), {
    functionName: 'list_files',
    callId: '3',
    description: null,
  });
});

test('qwen config only targets extracted Monaco pre elements, not original virtualized Qwen pre', () => {
  const selectors = config.CONFIG.targetSelectors;
  const monacoIndex = selectors.indexOf('pre[data-monaco-source]');

  assert.notEqual(monacoIndex, -1);
  assert.equal(selectors.includes('pre:not([data-monaco-hidden-function-call])'), false);
  assert.equal(selectors.includes('pre'), false);
  assert.equal(selectors.includes('code'), false);
});
