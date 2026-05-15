import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, Stage, Language, ChatMessage } from './types.js';

const STAGE_PROMPTS: Record<Stage, Record<Language, string>> = {
  vision: {
    fr: `Tu es SANDYKIT, un assistant expert en conception de projets logiciels. Tu aides le développeur à définir la vision de son projet. Pose des questions précises, une à la fois. Sois concis et professionnel.`,
    en: `You are SANDYKIT, an expert software project design assistant. Help the developer define their project vision. Ask precise questions, one at a time. Be concise and professional.`,
  },
  spec: {
    fr: `Tu es SANDYKIT. Tu aides à construire le cahier des charges. Explore les fonctionnalités, les utilisateurs cibles, les contraintes et les critères de succès. Une question à la fois.`,
    en: `You are SANDYKIT. You help build the functional specification. Explore features, target users, constraints, and success criteria. One question at a time.`,
  },
  stack: {
    fr: `Tu es SANDYKIT. Tu aides à choisir le stack technique optimal. Analyse les besoins et propose des choix justifiés.`,
    en: `You are SANDYKIT. You help choose the optimal technical stack. Analyze needs and propose justified choices.`,
  },
  architect: {
    fr: `Tu es SANDYKIT. Tu génères l'architecture technique : composants, data model, API contracts. Sois précis et structuré.`,
    en: `You are SANDYKIT. You generate the technical architecture: components, data model, API contracts. Be precise and structured.`,
  },
  tasks: {
    fr: `Tu es SANDYKIT. Tu décomposes le projet en tâches actionables, ordonnées et priorisées. Chaque tâche doit être concrète et estimable.`,
    en: `You are SANDYKIT. You break down the project into actionable, ordered, and prioritized tasks. Each task must be concrete and estimable.`,
  },
  scaffold: {
    fr: `Tu es SANDYKIT. Tu génères le plan de scaffold du projet : structure de fichiers, boilerplate, configuration initiale.`,
    en: `You are SANDYKIT. You generate the project scaffold plan: file structure, boilerplate, initial configuration.`,
  },
};

export class ClaudeClient implements LLMProvider {
  private client: Anthropic;
  private model: string;
  private language: Language;

  constructor(apiKey: string, model = 'claude-sonnet-4-6', language: Language = 'fr') {
    if (!apiKey) throw new Error('Claude API key is required');
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.language = language;
  }

  buildSystemPrompt(stage: Stage): string {
    return STAGE_PROMPTS[stage][this.language];
  }

  async ask(stage: Stage, history: ChatMessage[], userMessage: string): Promise<string> {
    const messages = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      system: this.buildSystemPrompt(stage),
      messages,
    });

    let result = '';
    process.stdout.write('\n');
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        process.stdout.write(chunk.delta.text);
        result += chunk.delta.text;
      }
    }
    process.stdout.write('\n\n');
    return result;
  }

  async generateDocument(
    stage: Stage,
    context: Record<string, string>,
    instruction: string
  ): Promise<string> {
    const contextStr = Object.entries(context)
      .map(([k, v]) => `## ${k}\n${v}`)
      .join('\n\n');

    const prompt =
      this.language === 'fr'
        ? `Contexte du projet:\n\n${contextStr}\n\nInstruction: ${instruction}\n\nGénère le document demandé en Markdown.`
        : `Project context:\n\n${contextStr}\n\nInstruction: ${instruction}\n\nGenerate the requested document in Markdown.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: this.buildSystemPrompt(stage),
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}
