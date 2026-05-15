import * as p from '@clack/prompts';
import * as ui from '../ui/display.js';
import { askText, askSelect } from '../ui/prompt.js';
import { createSession, saveSession, getProjectOutputDir } from '../session/store.js';
import { runStage, isComplete } from '../pipeline/runner.js';
import { createLLMProvider } from '../llm/factory.js';
import type { ConfigManager } from '../config.js';
import type { PipelineStage, ProjectDomain } from '../session/types.js';
import type { ChatMessage, Stage } from '../llm/types.js';

const STAGE_QUESTIONS: Record<PipelineStage, { fr: string; en: string }> = {
  vision: {
    fr: 'Décris ton projet en quelques phrases. Quel problème résout-il ?',
    en: 'Describe your project in a few sentences. What problem does it solve?',
  },
  spec: {
    fr: 'Quelles sont les fonctionnalités principales que tu veux implémenter ?',
    en: 'What are the main features you want to implement?',
  },
  stack: {
    fr: 'Quel stack technique envisages-tu ? (ou dis-moi les contraintes et je t\'aide à choisir)',
    en: 'What tech stack are you considering? (or tell me the constraints and I\'ll help you choose)',
  },
  architect: {
    fr: 'Parlons de l\'architecture. Comment tu vois les grands composants du système ?',
    en: 'Let\'s talk architecture. How do you see the main components of the system?',
  },
  tasks: {
    fr: 'Maintenant décomposons en tâches. Par quoi veux-tu commencer ?',
    en: 'Now let\'s break it into tasks. What do you want to start with?',
  },
  scaffold: {
    fr: 'Parfait. Je génère maintenant le scaffold. Des préférences sur la structure de fichiers ?',
    en: 'Great. I\'m now generating the scaffold. Any preferences on the file structure?',
  },
};

export async function runChatMode(cfg: ConfigManager): Promise<void> {
  const lang = cfg.getLanguage();
  const llm = createLLMProvider(cfg.getProvider(), cfg.getApiKey(), cfg.getModel(), lang);

  const projectName = await askText(
    lang === 'fr' ? 'Nom du projet :' : 'Project name:',
    lang === 'fr' ? 'mon-projet' : 'my-project'
  );

  const domain = await askSelect<ProjectDomain>(
    lang === 'fr' ? 'Domaine du projet :' : 'Project domain:',
    [
      { value: 'web', label: 'Web', hint: 'React, Next.js, Vite' },
      { value: 'api', label: 'API REST', hint: 'Express, FastAPI, NestJS' },
      { value: 'data', label: 'Data / ML', hint: 'Python, Jupyter, dbt' },
      { value: 'mobile', label: 'Mobile', hint: 'React Native, Expo' },
      { value: 'cli-tool', label: 'CLI Tool', hint: 'Node.js, Go, Python' },
    ]
  );

  const session = createSession(projectName, 'chat');
  session.domain = domain;
  saveSession(session);

  ui.info(lang === 'fr' ? `Projet "${projectName}" créé (${domain})` : `Project "${projectName}" created (${domain})`);
  ui.dim(lang === 'fr' ? `Fichiers sauvegardés dans : ${getProjectOutputDir(session.id)}` : `Files saved to: ${getProjectOutputDir(session.id)}`);

  const stages: PipelineStage[] = ['vision', 'spec', 'stack', 'architect', 'tasks', 'scaffold'];

  for (const stage of stages) {
    const question = STAGE_QUESTIONS[stage][lang];
    const history: ChatMessage[] = [];

    ui.section(lang === 'fr' ? `Étape : ${stage}` : `Stage: ${stage}`);
    console.log('\n' + question + '\n');

    let stageContent = '';
    let exchangeCount = 0;
    const MAX_EXCHANGES = 5;

    while (exchangeCount < MAX_EXCHANGES) {
      const userInput = await askText(lang === 'fr' ? 'Toi :' : 'You:');

      if (userInput.toLowerCase() === '/done' || userInput.toLowerCase() === '/next') {
        break;
      }

      history.push({ role: 'user', content: userInput });

      ui.dim(lang === 'fr' ? 'SANDYKIT réfléchit...' : 'SANDYKIT thinking...');
      const response = await llm.ask(stage as Stage, history, userInput);
      history.push({ role: 'assistant', content: response });

      stageContent += `\n${userInput}\n${response}`;
      exchangeCount++;

      const continueStage = await p.confirm({
        message: lang === 'fr' ? 'Continuer cette étape ?' : 'Continue this stage?',
        initialValue: exchangeCount < 2,
      });

      if (p.isCancel(continueStage) || !continueStage) break;
    }

    if (!stageContent.trim()) {
      stageContent = history.map(m => m.content).join('\n');
    }

    await runStage(session, llm, stage, stageContent.trim());
  }

  if (isComplete(session)) {
    ui.success(
      lang === 'fr'
        ? `\nProjet "${projectName}" complété ! Fichiers dans : ${getProjectOutputDir(session.id)}`
        : `\nProject "${projectName}" complete! Files in: ${getProjectOutputDir(session.id)}`
    );
  }
}
