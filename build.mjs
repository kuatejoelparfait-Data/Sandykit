import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/cli.cjs',
  external: ['@anthropic-ai/sdk', 'openai', '@clack/prompts', 'chalk', 'boxen', 'conf'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});

console.log('Build complete → dist/cli.cjs');
