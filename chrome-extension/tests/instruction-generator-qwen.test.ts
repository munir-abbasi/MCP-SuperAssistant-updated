import assert from 'node:assert/strict';
import test from 'node:test';

const generator = await import('../../pages/content/src/components/sidebar/Instructions/instructionGeneratorJson.ts');

const sampleTools = [
  {
    name: 'filesystem.list_directory',
    description: 'List files in a directory',
    schema: JSON.stringify({
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
      },
      required: ['path'],
    }),
  },
];

const setHostname = (hostname: string) => {
  (globalThis as unknown as { window: { location: { hostname: string } } }).window = {
    location: { hostname },
  };
};

test('uses strict Qwen JSONL instructions without thoughts or manual execution wording', () => {
  setHostname('chat.qwen.ai');

  const instructions = generator.generateInstructionsJson(sampleTools);
  const normalized = instructions.toLowerCase();

  assert.match(instructions, /SuperAssistant Qwen JSONL Tool Instructions/);
  assert.match(instructions, /"type": "function_call_start"/);
  assert.match(instructions, /"type": "parameter"/);
  assert.match(instructions, /"type": "function_call_end"/);
  assert.match(instructions, /filesystem\.list_directory/);
  assert.doesNotMatch(normalized, /<thoughts/);
  assert.doesNotMatch(normalized, /<\/thoughts>/);
  assert.doesNotMatch(normalized, /ask user to invoke/);
  assert.doesNotMatch(normalized, /manually execute/);
  assert.doesNotMatch(normalized, /json array format/);
  assert.doesNotMatch(normalized, /parameters object/);
  assert.doesNotMatch(normalized, /response_format/);
  assert.doesNotMatch(normalized, /<\\?system/);
  assert.doesNotMatch(normalized, /custom_instructions/);
});

test('keeps generic non-Qwen instruction format unchanged', () => {
  setHostname('chat.openai.com');

  const instructions = generator.generateInstructionsJson(sampleTools);

  assert.match(instructions, /<thoughts optional="true">/);
  assert.match(instructions, /Use JSON array format for function calls/);
  assert.doesNotMatch(instructions, /SuperAssistant Qwen JSONL Tool Instructions/);
});
