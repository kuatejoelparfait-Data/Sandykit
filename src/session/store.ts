import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Session } from './types.js';

function getProjectsDir(): string {
  return join(homedir(), '.sandykit', 'projects');
}

function getSessionPath(projectId: string): string {
  return join(getProjectsDir(), projectId, 'session.json');
}

function getProjectDir(projectId: string): string {
  return join(getProjectsDir(), projectId);
}

export function saveSession(session: Session): void {
  const dir = getProjectDir(session.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  session.updatedAt = new Date().toISOString();
  writeFileSync(getSessionPath(session.id), JSON.stringify(session, null, 2), 'utf-8');
}

export function loadSession(projectId: string): Session | null {
  const path = getSessionPath(projectId);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Session;
  } catch {
    return null;
  }
}

export function listSessions(): Session[] {
  const dir = getProjectsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map(id => loadSession(id))
    .filter((s): s is Session => s !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createSession(name: string, mode: 'chat' | 'auto'): Session {
  const id = `${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`;
  const now = new Date().toISOString();
  return {
    id,
    name,
    domain: null,
    mode,
    currentStage: 'vision',
    completedStages: [],
    context: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function getProjectOutputDir(projectId: string): string {
  return getProjectDir(projectId);
}
