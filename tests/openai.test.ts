import { describe, it, expect } from 'vitest';
import { OpenAIClient } from '../src/llm/openai.js';

describe('OpenAIClient', () => {
  it('throws without api key', () => {
    expect(() => new OpenAIClient('')).toThrow('API key');
  });

  it('builds system prompt for each stage', () => {
    const client = new OpenAIClient('fake-key');
    const stages = ['vision', 'spec', 'stack', 'architect', 'tasks', 'scaffold'] as const;
    for (const stage of stages) {
      const prompt = client.buildSystemPrompt(stage);
      expect(prompt.length).toBeGreaterThan(10);
      expect(prompt).toContain('SANDYKIT');
    }
  });

  it('builds english prompts when language is en', () => {
    const client = new OpenAIClient('fake-key', 'gpt-4o', 'en');
    const prompt = client.buildSystemPrompt('vision');
    expect(prompt).toContain('You are');
  });
});
