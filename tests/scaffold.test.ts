import { describe, it, expect, afterEach } from 'vitest';
import { generateScaffold } from '../src/generators/scaffold.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Scaffold generator', () => {
  const outputDir = join(tmpdir(), 'sandykit-test-scaffold');

  afterEach(() => {
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it('generates web scaffold files', () => {
    const files = generateScaffold('web', 'my-web-app', outputDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('package.json'))).toBe(true);
    expect(files.some(f => f.includes('main.tsx'))).toBe(true);
  });

  it('generates api scaffold files', () => {
    const files = generateScaffold('api', 'my-api', outputDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('index.ts'))).toBe(true);
  });

  it('generates data scaffold files', () => {
    const files = generateScaffold('data', 'my-pipeline', outputDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('requirements.txt'))).toBe(true);
  });

  it('generates mobile scaffold files', () => {
    const files = generateScaffold('mobile', 'my-app', outputDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('package.json'))).toBe(true);
  });

  it('generates cli-tool scaffold files', () => {
    const files = generateScaffold('cli-tool', 'my-cli', outputDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('index.ts'))).toBe(true);
  });
});
