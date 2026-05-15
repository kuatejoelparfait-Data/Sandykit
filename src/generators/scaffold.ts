import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { generateWebFiles } from '../templates/domains/web.js';
import { generateApiFiles } from '../templates/domains/api.js';
import { generateDataFiles } from '../templates/domains/data.js';
import { generateMobileFiles } from '../templates/domains/mobile.js';
import { generateCliToolFiles } from '../templates/domains/cli-tool.js';
import type { ProjectDomain } from '../session/types.js';

export function generateScaffold(
  domain: ProjectDomain,
  projectName: string,
  outputDir: string
): string[] {
  const files = getFilesForDomain(domain, projectName);
  const created: string[] = [];

  for (const file of files) {
    const fullPath = join(outputDir, 'scaffold', file.path);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
    created.push(file.path);
  }

  return created;
}

function getFilesForDomain(
  domain: ProjectDomain,
  projectName: string
): Array<{ path: string; content: string }> {
  switch (domain) {
    case 'web':
      return generateWebFiles(projectName);
    case 'api':
      return generateApiFiles(projectName);
    case 'data':
      return generateDataFiles(projectName);
    case 'mobile':
      return generateMobileFiles(projectName);
    case 'cli-tool':
      return generateCliToolFiles(projectName);
  }
}
