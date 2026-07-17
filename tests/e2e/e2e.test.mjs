import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(currentDirectory, '../..');
const browser = process.env.CEB_E2E_BROWSER;

// Fixture server config
const FIXTURE_PORT = parseInt(process.env.FIXTURE_PORT || '3456', 10);
const FIXTURE_BASE = `http://localhost:${FIXTURE_PORT}`;

const packagedFileExtension = (browserName) => {
  switch (browserName) {
    case 'chrome':
      return '.zip';
    case 'firefox':
      return '.xpi';
    default:
      throw new Error(`Unsupported CEB_E2E_BROWSER: ${browserName ?? '<unset>'}`);
  }
};

test('has an explicit browser mode for the E2E package contract', () => {
  assert.match(browser ?? '', /^(chrome|firefox)$/);
});

test('fixture server is reachable (pre-requisite for browser E2E tests)', async () => {
  const res = await fetch(`${FIXTURE_BASE}/`);
  assert.equal(res.status, 405, 'GET / should return 405 (validates fixture server is running)');
});

test('packaged extension files match the selected browser contract', async () => {
  // Given: the root e2e script has just built and packaged the selected browser target.
  const distDirectory = join(repositoryRoot, 'dist');
  const manifestPath = join(distDirectory, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  // When: the deterministic packaging contract is inspected from disk.
  const backgroundStats = await stat(join(distDirectory, 'background.js'));
  const contentScriptStats = await stat(join(distDirectory, 'content', 'index.iife.js'));
  const archiveExtension = packagedFileExtension(browser);
  const archiveNames = (await readdir(join(repositoryRoot, 'dist-zip'))).filter((name) =>
    name.endsWith(archiveExtension),
  );

  // Then: the package command produced a non-empty extension artifact and the manifest matches the target.
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '0.6.2');
  assert.equal(manifest.name, 'MCP SuperAssistant');
  assert.ok(backgroundStats.size > 0);
  assert.ok(contentScriptStats.size > 0);
  assert.ok(archiveNames.length > 0, `Expected a ${archiveExtension} artifact in dist-zip`);

  if (browser === 'chrome') {
    assert.equal(manifest.background.service_worker, 'background.js');
    assert.equal(manifest.background.type, 'module');
    assert.equal(manifest.content_security_policy, undefined);
    return;
  }

  assert.deepEqual(manifest.background.scripts, ['background.js']);
  assert.equal(manifest.background.type, 'module');
  assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self'; object-src 'self'");
});
