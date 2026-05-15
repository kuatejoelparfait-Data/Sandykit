import { describe, it, expect } from 'vitest';
import { ClaudeClient } from '../src/llm/claude.js';

describe('ClaudeClient', () => {
  it('throws without api key', () => {
    expect(() => new ClaudeClient('')).toThrow('API key');
  });

  it('builds system prompt for each stage', () => {
    const client = new ClaudeClient('fake-key');
    const stages = ['vision', 'spec', 'stack', 'architect', 'tasks', 'scaffold'] as const;
    for (const stage of stages) {
      const prompt = client.buildSystemPrompt(stage);
      expect(prompt.length).toBeGreaterThan(10);
      expect(prompt).toContain('SANDYKIT');
    }
  });

  it('builds english prompts when language is en', () => {
    const client = new ClaudeClient('fake-key', 'claude-sonnet-4-6', 'en');
    const prompt = client.buildSystemPrompt('vision');
    expect(prompt).toContain('You are');
  });

  it('builds french prompts by default', () => {
    const client = new ClaudeClient('fake-key');
    const prompt = client.buildSystemPrompt('vision');
    expect(prompt).toContain('Tu es');
  });
});
