import { describe, it, expect } from 'vitest';
import { createLLMProvider, DEFAULT_MODELS } from '../src/llm/factory.js';
import { ClaudeClient } from '../src/llm/claude.js';
import { OpenAIClient } from '../src/llm/openai.js';

describe('LLM Factory', () => {
  it('creates ClaudeClient for provider=claude', () => {
    const provider = createLLMProvider('claude', 'fake-key', 'claude-sonnet-4-6', 'fr');
    expect(provider).toBeInstanceOf(ClaudeClient);
  });

  it('creates OpenAIClient for provider=openai', () => {
    const provider = createLLMProvider('openai', 'fake-key', 'gpt-4o', 'fr');
    expect(provider).toBeInstanceOf(OpenAIClient);
  });

  it('throws if api key is empty for claude', () => {
    expect(() => createLLMProvider('claude', '', 'claude-sonnet-4-6', 'fr')).toThrow('API key');
  });

  it('throws if api key is empty for openai', () => {
    expect(() => createLLMProvider('openai', '', 'gpt-4o', 'fr')).toThrow('API key');
  });

  it('has correct default models', () => {
    expect(DEFAULT_MODELS.claude).toBe('claude-sonnet-4-6');
    expect(DEFAULT_MODELS.openai).toBe('gpt-4o');
  });
});
