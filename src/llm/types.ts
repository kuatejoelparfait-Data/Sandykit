export type Stage = 'vision' | 'spec' | 'stack' | 'architect' | 'tasks' | 'scaffold';
export type Language = 'fr' | 'en';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  ask(
    stage: Stage,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string>;

  generateDocument(
    stage: Stage,
    context: Record<string, string>,
    instruction: string
  ): Promise<string>;

  buildSystemPrompt(stage: Stage): string;
}
