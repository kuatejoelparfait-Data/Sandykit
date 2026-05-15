import { ClaudeClient } from './claude.js';
import { OpenAIClient } from './openai.js';
import type { LLMProvider, Language } from './types.js';

export type LLMProviderName = 'claude' | 'openai';

export function createLLMProvider(
  provider: LLMProviderName,
  apiKey: string,
  model: string,
  language: Language
): LLMProvider {
  if (provider === 'openai') {
    return new OpenAIClient(apiKey, model, language);
  }
  return new ClaudeClient(apiKey, model, language);
}

export const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
};
