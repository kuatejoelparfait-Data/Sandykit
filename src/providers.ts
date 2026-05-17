import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type ProviderType = 'claude' | 'openai' | 'ollama' | 'custom';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIProvider {
  generate(prompt: string, system?: string): Promise<string>;
  stream(prompt: string, system: string, onChunk: (text: string) => void): Promise<void>;
}

// ─── Claude ───────────────────────────────────────────────────────────────────

class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(cfg: ProviderConfig) {
    this.client = new Anthropic({ apiKey: cfg.apiKey });
    this.model = cfg.model ?? 'claude-sonnet-4-6';
  }

  async generate(prompt: string, system = ''): Promise<string> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: system || undefined,
      messages: [{ role: 'user', content: prompt }],
    });
    return (msg.content[0] as { text: string }).text;
  }

  async stream(prompt: string, system: string, onChunk: (text: string) => void): Promise<void> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 8192,
      system: system || undefined,
      messages: [{ role: 'user', content: prompt }],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        onChunk(event.delta.text);
      }
    }
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(cfg: ProviderConfig) {
    this.client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl });
    this.model = cfg.model ?? 'gpt-4o';
  }

  async generate(prompt: string, system = ''): Promise<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    const res = await this.client.chat.completions.create({ model: this.model, messages });
    return res.choices[0]?.message?.content ?? '';
  }

  async stream(prompt: string, system: string, onChunk: (text: string) => void): Promise<void> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    const stream = await this.client.chat.completions.create({ model: this.model, messages, stream: true });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) onChunk(text);
    }
  }
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(cfg: ProviderConfig) {
    this.baseUrl = (cfg.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    this.model = cfg.model ?? 'llama3';
  }

  async generate(prompt: string, system = ''): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await res.json() as { message?: { content?: string } };
    return data.message?.content ?? '';
  }

  async stream(prompt: string, system: string, onChunk: (text: string) => void): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    });
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line) as { message?: { content?: string } };
          if (json.message?.content) onChunk(json.message.content);
        } catch { /* ignore parse errors */ }
      }
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createProvider(cfg: ProviderConfig): AIProvider {
  switch (cfg.type) {
    case 'claude':  return new ClaudeProvider(cfg);
    case 'openai':  return new OpenAIProvider(cfg);
    case 'ollama':  return new OllamaProvider(cfg);
    case 'custom':  return new OpenAIProvider(cfg); // compatible OpenAI
  }
}

export const PROVIDER_MODELS: Record<ProviderType, string[]> = {
  claude:  ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai:  ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  ollama:  ['llama3', 'mistral', 'codellama', 'phi3', 'gemma2'],
  custom:  [],
};
