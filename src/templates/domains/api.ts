export function generateApiFiles(projectName: string): Array<{ path: string; content: string }> {
  return [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: projectName,
        version: '0.1.0',
        scripts: { dev: 'tsx src/index.ts', build: 'tsc', start: 'node dist/index.js' },
        dependencies: { express: '^4.18.0', cors: '^2.8.5' },
        devDependencies: {
          '@types/express': '^4.17.0',
          '@types/cors': '^2.8.0',
          '@types/node': '^22.0.0',
          tsx: '^4.0.0',
          typescript: '^5.0.0',
        },
      }, null, 2),
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'CommonJS',
          strict: true,
          esModuleInterop: true,
          outDir: 'dist',
          rootDir: 'src',
        },
        include: ['src'],
      }, null, 2),
    },
    {
      path: 'src/index.ts',
      content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', project: '${projectName}' });
});

app.listen(PORT, () => {
  console.log(\`${projectName} running on port \${PORT}\`);
});
`,
    },
    {
      path: 'src/routes/index.ts',
      content: `import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Hello from ${projectName}' });
});

export default router;
`,
    },
  ];
}
