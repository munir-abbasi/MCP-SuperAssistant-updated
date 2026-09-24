import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import manifest, { toManifestVersion } from '../manifest.ts';

test('encodes package SemVer as a browser-safe monotonic manifest version', () => {
  assert.equal(toManifestVersion('0.6.2-alpha.1'), '0.6.2.10001');
  assert.equal(toManifestVersion('0.6.2-beta.1'), '0.6.2.30001');
  assert.equal(toManifestVersion('0.6.2-rc.1'), '0.6.2.50001');
  assert.equal(toManifestVersion('0.6.2'), '0.6.2.65535');
});

test('rejects package versions that cannot be represented safely', () => {
  assert.throws(() => toManifestVersion('0.6.2-preview.1'), /Unsupported package version/);
  assert.throws(() => toManifestVersion('65536.0.0'), /exceeds browser manifest limit/);
  assert.throws(() => toManifestVersion('0.6.2-rc.10000'), /prerelease sequence exceeds browser manifest limit/);
});

test('current generated manifest version is browser-safe and retains the package label', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };

  assert.match(manifest.version, /^(0|[1-9]\d*)(?:\.(0|[1-9]\d*)){0,3}$/);
  assert.equal(manifest.version, toManifestVersion(packageJson.version));
  assert.equal(manifest.version_name, packageJson.version);
});
