import * as ui from '../ui/display.js';
import { askText, askSelect } from '../ui/prompt.js';
import { startSpinner } from '../ui/spinner.js';
import { createSession, saveSession, getProjectOutputDir } from '../session/store.js';
import { runStage, isComplete } from '../pipeline/runner.js';
import { createLLMProvider } from '../llm/factory.js';
import type { ConfigManager } from '../config.js';
import type { PipelineStage, ProjectDomain } from '../session/types.js';
import type { Stage } from '../llm/types.js';

const STAGE_INSTRUCTIONS: Record<PipelineStage, { fr: string; en: string }> = {
  vision: {
    fr: 'Génère une vision complète du projet en Markdown : description, utilisateurs cibles, problème résolu, valeur ajoutée.',
    en: 'Generate a complete project vision in Markdown: description, target users, problem solved, added value.',
  },
  spec: {
    fr: 'Génère un cahier des charges complet en Markdown : fonctionnalités principales et secondaires, contraintes, critères de succès.',
    en: 'Generate a complete functional specification in Markdown: main and secondary features, constraints, success criteria.',
  },
  stack: {
    fr: 'Recommande et justifie le stack technique optimal en Markdown.',
    en: 'Recommend and justify the optimal tech stack in Markdown.',
  },
  architect: {
    fr: 'Génère l\'architecture complète en Markdown : composants, data model, API contracts.',
    en: 'Generate the complete architecture in Markdown: components, data model, API contracts.',
  },
  tasks: {
    fr: 'Génère un plan de tâches ordonnées et priorisées en Markdown.',
    en: 'Generate an ordered and prioritized task plan in Markdown.',
  },
  scaffold: {
    fr: 'Génère le plan de scaffold du projet : structure de fichiers et boilerplate.',
    en: 'Generate the project scaffold plan: file structure and boilerplate.',
  },
};

export async function runAutoMode(cfg: ConfigManager): Promise<void> {
  const lang = cfg.getLanguage();
  const llm = createLLMProvider(cfg.getProvider(), cfg.getApiKey(), cfg.getModel(), lang);

  const projectName = await askText(
    lang === 'fr' ? 'Nom du projet :' : 'Project name:',
    lang === 'fr' ? 'mon-projet' : 'my-project'
  );

  const description = await askText(
    lang === 'fr'
      ? 'Décris ton projet en quelques phrases :'
      : 'Describe your project in a few sentences:',
    lang === 'fr' ? 'Une app qui...' : 'An app that...'
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

  const clarification1 = await askText(
    lang === 'fr' ? 'Public cible (ex: dev, entreprises, grand public) :' : 'Target audience (e.g.: devs, businesses, general public):'
  );

  const clarification2 = await askText(
    lang === 'fr' ? 'Contraintes techniques ou budget (ex: open source, gratuit, TS only) :' : 'Technical or budget constraints (e.g.: open source, free, TS only):'
  );

  const session = createSession(projectName, 'auto');
  session.domain = domain;
  session.context['description'] = description;
  session.context['users'] = clarification1;
  session.context['constraints'] = clarification2;
  saveSession(session);

  ui.info(
    lang === 'fr'
      ? `Génération automatique de "${projectName}" (${domain})...`
      : `Auto-generating "${projectName}" (${domain})...`
  );
  ui.dim(lang === 'fr' ? `Fichiers dans : ${getProjectOutputDir(session.id)}` : `Files in: ${getProjectOutputDir(session.id)}`);

  const stages: PipelineStage[] = ['vision', 'spec', 'stack', 'architect', 'tasks', 'scaffold'];

  for (const stage of stages) {
    const instruction = STAGE_INSTRUCTIONS[stage][lang];
    const spinner = startSpinner(lang === 'fr' ? `Génération : ${stage}...` : `Generating: ${stage}...`);

    try {
      const content = await llm.generateDocument(stage as Stage, session.context, instruction);
      session.context[stage] = content;
      spinner.stop(lang === 'fr' ? `${stage} ✓` : `${stage} ✓`);
      await runStage(session, llm, stage, content);
    } catch (err) {
      spinner.stop(`${stage} - erreur`);
      ui.error(`Erreur sur ${stage}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (isComplete(session)) {
    ui.success(
      lang === 'fr'
        ? `\nProjet "${projectName}" généré ! Tous les fichiers sont dans :\n${getProjectOutputDir(session.id)}`
        : `\nProject "${projectName}" generated! All files are in:\n${getProjectOutputDir(session.id)}`
    );
  }
}
