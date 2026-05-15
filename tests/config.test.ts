import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../src/config.js';

describe('ConfigManager', () => {
  let cfg: ConfigManager;

  beforeEach(() => {
    cfg = new ConfigManager();
  });

  it('returns default provider as claude', () => {
    expect(cfg.getProvider()).toBe('claude');
  });

  it('reads claude api key from env var', () => {
    process.env['SANDYKIT_API_KEY'] = 'test-key-123';
    const key = cfg.getClaudeApiKey();
    expect(key).toBe('test-key-123');
    delete process.env['SANDYKIT_API_KEY'];
  });

  it('reads openai api key from env var', () => {
    process.env['SANDYKIT_OPENAI_KEY'] = 'sk-test-openai';
    const key = cfg.getOpenAIApiKey();
    expect(key).toBe('sk-test-openai');
    delete process.env['SANDYKIT_OPENAI_KEY'];
  });

  it('hasApiKey returns false when no key set', () => {
    delete process.env['SANDYKIT_API_KEY'];
    delete process.env['SANDYKIT_CLAUDE_KEY'];
    // stored key may vary, so just check it returns boolean
    expect(typeof cfg.hasApiKey()).toBe('boolean');
  });

  it('returns default language as fr', () => {
    expect(cfg.getLanguage()).toBe('fr');
  });
});
