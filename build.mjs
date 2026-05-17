import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'fs';

await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/cli.cjs',
  external: ['@anthropic-ai/sdk', 'openai', '@clack/prompts', 'conf', 'chokidar', 'pdf-parse', 'mammoth'],
  banner: {
    js: '#!/usr/bin/env node --no-deprecation',
  },
});

// Copy templates to dist/ so the installer can find them at runtime
mkdirSync('dist/templates', { recursive: true });
cpSync('src/templates', 'dist/templates', { recursive: true });

console.log('Build complete → dist/cli.cjs + dist/templates/');
