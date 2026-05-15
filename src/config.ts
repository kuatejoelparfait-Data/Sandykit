import Conf from 'conf';
import type { LLMProviderName } from './llm/factory.js';
import type { Language } from './llm/types.js';

interface ConfigSchema {
  provider: LLMProviderName;
  claudeApiKey: string;
  openaiApiKey: string;
  claudeModel: string;
  openaiModel: string;
  language: Language;
}

export class ConfigManager {
  private store: Conf<ConfigSchema>;

  constructor() {
    this.store = new Conf<ConfigSchema>({
      projectName: 'sandykit',
      defaults: {
        provider: 'claude',
        claudeApiKey: '',
        openaiApiKey: '',
        claudeModel: 'claude-sonnet-4-6',
        openaiModel: 'gpt-4o',
        language: 'fr',
      },
    });
  }

  getProvider(): LLMProviderName {
    return this.store.get('provider');
  }

  setProvider(provider: LLMProviderName): void {
    this.store.set('provider', provider);
  }

  getClaudeApiKey(): string {
    return process.env['SANDYKIT_CLAUDE_KEY'] ?? process.env['SANDYKIT_API_KEY'] ?? this.store.get('claudeApiKey');
  }

  setClaudeApiKey(key: string): void {
    this.store.set('claudeApiKey', key);
  }

  getOpenAIApiKey(): string {
    return process.env['SANDYKIT_OPENAI_KEY'] ?? this.store.get('openaiApiKey');
  }

  setOpenAIApiKey(key: string): void {
    this.store.set('openaiApiKey', key);
  }

  getApiKey(): string {
    return this.getProvider() === 'openai' ? this.getOpenAIApiKey() : this.getClaudeApiKey();
  }

  hasApiKey(): boolean {
    return this.getApiKey().length > 0;
  }

  getModel(): string {
    return this.getProvider() === 'openai'
      ? this.store.get('openaiModel')
      : this.store.get('claudeModel');
  }

  setModel(model: string): void {
    if (this.getProvider() === 'openai') {
      this.store.set('openaiModel', model);
    } else {
      this.store.set('claudeModel', model);
    }
  }

  getLanguage(): Language {
    return this.store.get('language');
  }

  setLanguage(lang: Language): void {
    this.store.set('language', lang);
  }
}
