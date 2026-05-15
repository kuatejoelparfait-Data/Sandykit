import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSession, saveSession, loadSession, listSessions } from '../src/session/store.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const testProjectsDir = join(homedir(), '.sandykit', 'projects');

describe('Session store', () => {
  let sessionId: string;

  afterEach(() => {
    if (sessionId && existsSync(join(testProjectsDir, sessionId))) {
      rmSync(join(testProjectsDir, sessionId), { recursive: true, force: true });
    }
  });

  it('creates a session with correct defaults', () => {
    const session = createSession('test-project', 'chat');
    sessionId = session.id;
    expect(session.name).toBe('test-project');
    expect(session.mode).toBe('chat');
    expect(session.currentStage).toBe('vision');
    expect(session.completedStages).toHaveLength(0);
    expect(session.domain).toBeNull();
  });

  it('saves and loads a session', () => {
    const session = createSession('save-load-test', 'auto');
    sessionId = session.id;
    session.domain = 'web';
    session.context['vision'] = 'A web app';

    saveSession(session);
    const loaded = loadSession(session.id);

    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('save-load-test');
    expect(loaded!.domain).toBe('web');
    expect(loaded!.context['vision']).toBe('A web app');
  });

  it('returns null for non-existent session', () => {
    const result = loadSession('non-existent-id');
    expect(result).toBeNull();
  });

  it('lists sessions', () => {
    const session = createSession('list-test', 'chat');
    sessionId = session.id;
    saveSession(session);

    const sessions = listSessions();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.some(s => s.id === session.id)).toBe(true);
  });
});
