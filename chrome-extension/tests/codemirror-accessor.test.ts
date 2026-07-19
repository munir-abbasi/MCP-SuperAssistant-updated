import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const accessorPath = resolve(__dirname, '../public/codemirror-accessor.js');

test('CodeMirrorAccessor.stop does not throw during cleanup', () => {
  const source = readFileSync(accessorPath, 'utf8');

  const sandbox = {
    console: {
      debug: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    document: {
      readyState: 'loading',
      addEventListener: () => undefined,
      querySelectorAll: () => [],
      getElementById: () => null,
      body: {},
    },
    window: {
      addEventListener: () => undefined,
      CodeMirrorAccessor: undefined as undefined | { stop: () => void },
      CodeMirrorAccessorExecuted: false,
    },
  };

  vm.runInNewContext(source, sandbox, { filename: accessorPath });

  assert.equal(typeof sandbox.window.CodeMirrorAccessor?.stop, 'function');
  assert.doesNotThrow(() => sandbox.window.CodeMirrorAccessor?.stop());
});

test('Qwen Monaco extraction prefers the full Monaco model over visible viewport lines', () => {
  const source = readFileSync(accessorPath, 'utf8');
  const fullJsonl = [
    '{"type": "function_call_start", "name": "filesystem.directory_tree", "call_id": 1}',
    '{"type": "parameter", "key": "path", "value": "plugins/generic/publishToFacebook"}',
    '{"type": "function_call_end", "call_id": 1}',
  ].join('\n');
  const insertedPre: { textContent?: string; attributes: Record<string, string>; style: { cssText: string }; className?: string; id?: string; setAttribute: (name: string, value: string) => void } = {
    attributes: {},
    style: { cssText: '' },
    setAttribute(name: string, value: string) {
      this.attributes[name] = value;
    },
  };
  const monacoEditor = {
    getAttribute: (name: string) => (name === 'data-uri' ? 'inmemory://model/1' : null),
    querySelectorAll: () => [
      {
        querySelectorAll: () => [],
        textContent: '{"type": "function_call_start", "name": "filesystem.directory_tree", "call_id": 1}',
      },
    ],
  };
  const qwenBlock = {
    style: { cssText: '' },
    parentNode: {
      insertBefore: (node: typeof insertedPre) => {
        Object.assign(insertedPre, node);
      },
      querySelector: () => null,
    },
    querySelector: (selector: string) => {
      if (selector === '.monaco-editor') return monacoEditor;
      if (selector === '.qwen-markdown-code-header > div:first-child') return { textContent: 'jsonl' };
      if (selector === '.qwen-markdown-code-body') return { className: 'qwen-markdown-code-body jsonl' };
      return null;
    },
    setAttribute: () => undefined,
  };

  const sandbox = {
    console: {
      debug: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    document: {
      readyState: 'complete',
      addEventListener: () => undefined,
      querySelectorAll: (selector: string) => (selector === 'pre.qwen-markdown-code' ? [qwenBlock] : []),
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => insertedPre,
      body: {},
    },
    window: {
      addEventListener: () => undefined,
      CodeMirrorAccessor: undefined as undefined | { forceUpdateQwenMonaco: () => void },
      CodeMirrorAccessorExecuted: false,
      monaco: {
        Uri: {
          parse: (uri: string) => ({ toString: () => uri }),
        },
        editor: {
          getModel: () => ({ getValue: () => fullJsonl }),
          getModels: () => [],
        },
      },
    },
  };

  vm.runInNewContext(source, sandbox, { filename: accessorPath });

  assert.equal(insertedPre.textContent, fullJsonl);
  assert.equal(insertedPre.attributes['data-language'], 'jsonl');
});

test('Qwen Monaco extraction can recover full JSONL from React-backed props when viewport is virtualized', () => {
  const source = readFileSync(accessorPath, 'utf8');
  const fullJsonl = [
    '```jsonl',
    '{"type": "function_call_start", "name": "filesystem.list_directory", "call_id": 1}',
    '{"type": "description", "text": "List a directory."}',
    '{"type": "parameter", "key": "path", "value": "plugins/generic/publishToFacebook"}',
    '{"type": "function_call_end", "call_id": 1}',
    '```',
  ].join('\n');
  const insertedPre: { textContent?: string; attributes: Record<string, string>; style: { cssText: string }; className?: string; id?: string; setAttribute: (name: string, value: string) => void } = {
    attributes: {},
    style: { cssText: '' },
    setAttribute(name: string, value: string) {
      this.attributes[name] = value;
    },
  };
  const visibleFirstLine = '{"type": "function_call_start", "name": "filesystem.list_directory", "call_id": 1}';
  const monacoEditor = {
    getAttribute: (name: string) => (name === 'data-uri' ? 'inmemory://model/1' : null),
    querySelectorAll: () => [
      {
        querySelectorAll: () => [],
        textContent: visibleFirstLine,
      },
    ],
  };
  const qwenBlock = {
    __reactProps$test: {
      children: {
        props: {
          value: fullJsonl,
        },
      },
    },
    style: { cssText: '' },
    parentNode: {
      insertBefore: (node: typeof insertedPre) => {
        Object.assign(insertedPre, node);
      },
      querySelector: () => null,
    },
    querySelector: (selector: string) => {
      if (selector === '.monaco-editor') return monacoEditor;
      if (selector === '.qwen-markdown-code-header > div:first-child') return { textContent: 'jsonl' };
      if (selector === '.qwen-markdown-code-body') return { className: 'qwen-markdown-code-body jsonl' };
      return null;
    },
    querySelectorAll: () => [],
    setAttribute: () => undefined,
  };

  const sandbox = {
    console: {
      debug: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    document: {
      readyState: 'complete',
      addEventListener: () => undefined,
      querySelectorAll: (selector: string) => (selector === 'pre.qwen-markdown-code' ? [qwenBlock] : []),
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => insertedPre,
      body: {},
    },
    window: {
      addEventListener: () => undefined,
      CodeMirrorAccessor: undefined as undefined | { forceUpdateQwenMonaco: () => void },
      CodeMirrorAccessorExecuted: false,
      monaco: {
        Uri: {
          parse: (uri: string) => ({ toString: () => uri }),
        },
        editor: {
          getModel: () => null,
          getModels: () => [],
        },
      },
    },
  };

  vm.runInNewContext(source, sandbox, { filename: accessorPath });

  assert.equal(
    insertedPre.textContent,
    [
      '{"type": "function_call_start", "name": "filesystem.list_directory", "call_id": 1}',
      '{"type": "description", "text": "List a directory."}',
      '{"type": "parameter", "key": "path", "value": "plugins/generic/publishToFacebook"}',
      '{"type": "function_call_end", "call_id": 1}',
    ].join('\n'),
  );
});

test('Qwen Monaco extraction defers hidden pre creation until JSONL function call is complete', () => {
  const source = readFileSync(accessorPath, 'utf8');
  let insertedPre: unknown = null;
  const visibleFirstLine = '{"type": "function_call_start", "name": "filesystem.create_directory", "call_id": 1}';
  const monacoEditor = {
    getAttribute: (name: string) => (name === 'data-uri' ? 'inmemory://model/2' : null),
    querySelectorAll: () => [
      {
        querySelectorAll: () => [],
        textContent: visibleFirstLine,
      },
    ],
  };
  const qwenBlock = {
    style: { cssText: '' },
    parentNode: {
      insertBefore: (node: unknown) => {
        insertedPre = node;
      },
      querySelector: () => null,
    },
    querySelector: (selector: string) => {
      if (selector === '.monaco-editor') return monacoEditor;
      if (selector === '.qwen-markdown-code-header > div:first-child') return { textContent: 'jsonl' };
      if (selector === '.qwen-markdown-code-body') return { className: 'qwen-markdown-code-body jsonl' };
      return null;
    },
    querySelectorAll: () => [],
    setAttribute: () => undefined,
  };

  const sandbox = {
    console: {
      debug: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    document: {
      readyState: 'complete',
      addEventListener: () => undefined,
      querySelectorAll: (selector: string) => (selector === 'pre.qwen-markdown-code' ? [qwenBlock] : []),
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => ({
        attributes: {},
        style: { cssText: '' },
        setAttribute(name: string, value: string) {
          this.attributes[name] = value;
        },
      }),
      body: {},
    },
    window: {
      addEventListener: () => undefined,
      CodeMirrorAccessor: undefined as undefined | { forceUpdateQwenMonaco: () => void },
      CodeMirrorAccessorExecuted: false,
      monaco: {
        Uri: {
          parse: (uri: string) => ({ toString: () => uri }),
        },
        editor: {
          getModel: () => null,
          getModels: () => [],
        },
      },
    },
  };

  vm.runInNewContext(source, sandbox, { filename: accessorPath });

  assert.equal(insertedPre, null);
});
