export const webTemplate = {
  name: 'Web (React + Vite)',
  files: [
    { path: 'package.json', content: webPackageJson },
    { path: 'vite.config.ts', content: viteConfig },
    { path: 'tsconfig.json', content: webTsConfig },
    { path: 'index.html', content: indexHtml },
    { path: 'src/main.tsx', content: mainTsx },
    { path: 'src/App.tsx', content: appTsx },
    { path: 'src/App.css', content: '' },
    { path: 'src/index.css', content: '' },
  ],
};

function webPackageJson(projectName: string): string {
  return JSON.stringify({
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.0.0',
      typescript: '^5.0.0',
      vite: '^4.4.0',
    },
  }, null, 2);
}

function viteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
}

function webTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
    },
    include: ['src'],
  }, null, 2);
}

function indexHtml(projectName: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function mainTsx(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

function appTsx(projectName: string): string {
  return `import React from 'react';

function App() {
  return (
    <div>
      <h1>${projectName}</h1>
    </div>
  );
}

export default App;
`;
}

export function generateWebFiles(projectName: string): Array<{ path: string; content: string }> {
  return [
    { path: 'package.json', content: webPackageJson(projectName) },
    { path: 'vite.config.ts', content: viteConfig() },
    { path: 'tsconfig.json', content: webTsConfig() },
    { path: 'index.html', content: indexHtml(projectName) },
    { path: 'src/main.tsx', content: mainTsx() },
    { path: 'src/App.tsx', content: appTsx(projectName) },
    { path: 'src/App.css', content: '' },
    { path: 'src/index.css', content: '' },
  ];
}
