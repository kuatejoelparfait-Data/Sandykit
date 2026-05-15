export function generateCliToolFiles(projectName: string): Array<{ path: string; content: string }> {
  return [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: projectName,
        version: '0.1.0',
        type: 'module',
        bin: { [projectName]: './dist/index.cjs' },
        scripts: { build: 'node build.mjs', dev: 'tsx src/index.ts' },
        dependencies: { commander: '^13.0.0', chalk: '^5.0.0' },
        devDependencies: { '@types/node': '^22.0.0', esbuild: '^0.25.0', tsx: '^4.0.0', typescript: '^5.0.0' },
      }, null, 2),
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          esModuleInterop: true,
          outDir: 'dist',
          rootDir: 'src',
        },
        include: ['src'],
      }, null, 2),
    },
    {
      path: 'build.mjs',
      content: `import { build } from 'esbuild';
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  banner: { js: '#!/usr/bin/env node' },
});
console.log('Build complete');
`,
    },
    {
      path: 'src/index.ts',
      content: `import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('${projectName}')
  .description('${projectName} CLI')
  .version('0.1.0');

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log(chalk.cyan('Hello from ${projectName}!'));
  });

program.parse();
`,
    },
  ];
}
