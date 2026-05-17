import * as p from '@clack/prompts';
import chalk from 'chalk';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { showBanner } from './banner.js';
import { createProvider, PROVIDER_MODELS, type ProviderConfig, type ProviderType } from './providers.js';
import { readCahierDesCharges } from './reader.js';
import { saveConfig, loadConfig } from './config.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepResult<T> = { action: 'next'; data: T } | { action: 'back' } | { action: 'cancel' };

interface DevState {
  providerCfg?: ProviderConfig;
  projectName?: string;
  input?: string;
  spec?: string;
  plan?: string;
  tasks?: string;
  featureDir?: string;
}

// ─── System prompts ───────────────────────────────────────────────────────────

const SYSTEM_SPEC     = `Tu es un expert en spécification fonctionnelle. Rédige des specs claires, orientées valeur utilisateur, sans détails d'implémentation. Chaque exigence doit être testable. Réponds uniquement en markdown.`;
const SYSTEM_PLAN     = `Tu es un architecte logiciel senior. Génère un plan technique concis : stack, structure des dossiers, composants, flux de données. Réponds uniquement en markdown.`;
const SYSTEM_TASKS    = `Tu es un tech lead. Décompose le plan en tâches ordonnées avec dépendances. Chaque tâche < 1 journée. Format : checkboxes markdown par composant.`;
const SYSTEM_CODE     = `Tu es un développeur senior. Tu implémentes du code propre, complet, prêt à l'emploi. Pour chaque fichier utilise : ## Fichier: chemin/relatif\n\`\`\`\n[contenu]\n\`\`\``;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cancel(): never {
  p.cancel('Annulé');
  process.exit(0);
}

async function streamToConsole(
  provider: ReturnType<typeof createProvider>,
  prompt: string,
  system: string
): Promise<string> {
  let result = '';
  process.stdout.write(chalk.dim('\n'));
  await provider.stream(prompt, system, (chunk) => {
    process.stdout.write(chunk);
    result += chunk;
  });
  process.stdout.write('\n\n');
  return result;
}

async function actionMenu(label: string, canGoBack: boolean): Promise<'ok' | 'refine' | 'edit' | 'back' | 'cancel'> {
  const options: Array<{ value: string; label: string }> = [
    { value: 'ok',     label: '✓  Valider et continuer' },
    { value: 'refine', label: '↺  Régénérer (ajouter des précisions)' },
    { value: 'edit',   label: '✏  Modifier manuellement le fichier' },
  ];
  if (canGoBack) options.push({ value: 'back', label: '←  Étape précédente' });
  options.push({ value: 'cancel', label: '✗  Annuler' });

  const choice = await p.select({ message: `${label} — que faire ?`, options });
  if (p.isCancel(choice)) return 'cancel';
  return choice as 'ok' | 'refine' | 'edit' | 'back' | 'cancel';
}

async function confirmCancel(): Promise<boolean> {
  const sure = await p.confirm({ message: 'Voulez-vous vraiment annuler ?', initialValue: false });
  return !p.isCancel(sure) && (sure as boolean);
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

async function stepProvider(state: DevState): Promise<StepResult<ProviderConfig>> {
  p.intro(chalk.bold('① Provider IA'));

  const cfg = loadConfig();
  if (cfg?.provider) {
    const reuse = await p.select({
      message: `Provider sauvegardé : ${chalk.cyan(cfg.provider.type)} — ${cfg.provider.model ?? 'modèle par défaut'}`,
      options: [
        { value: 'reuse',  label: '✓  Utiliser ce provider' },
        { value: 'change', label: '↺  Changer de provider' },
        { value: 'cancel', label: '✗  Annuler' },
      ],
    });
    if (p.isCancel(reuse) || reuse === 'cancel') {
      if (await confirmCancel()) cancel();
      return stepProvider(state);
    }
    if (reuse === 'reuse') return { action: 'next', data: cfg.provider };
  }

  const providerType = await p.select({
    message: 'Quel provider IA ?',
    options: [
      { value: 'claude',  label: 'Claude (Anthropic)',    hint: 'API key requise' },
      { value: 'openai',  label: 'OpenAI (GPT-4o...)',    hint: 'API key requise' },
      { value: 'ollama',  label: 'Ollama (local)',         hint: 'Aucune clé, modèle local' },
      { value: 'custom',  label: 'Provider personnalisé', hint: 'URL + clé compatible OpenAI' },
    ],
  });
  if (p.isCancel(providerType)) { if (await confirmCancel()) cancel(); return stepProvider(state); }
  const type = providerType as ProviderType;

  let apiKey: string | undefined;
  let baseUrl: string | undefined;
  let model: string | undefined;

  if (type === 'claude' || type === 'openai') {
    const key = await p.password({
      message: `Clé API ${type === 'claude' ? 'Anthropic' : 'OpenAI'} :`,
      validate: v => (v.trim().length < 10 ? 'Clé invalide' : undefined),
    });
    if (p.isCancel(key)) { if (await confirmCancel()) cancel(); return stepProvider(state); }
    apiKey = key as string;
  }

  if (type === 'ollama' || type === 'custom') {
    const url = await p.text({
      message: type === 'ollama' ? 'URL Ollama :' : 'URL du provider :',
      placeholder: type === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com',
      defaultValue: type === 'ollama' ? 'http://localhost:11434' : '',
    });
    if (p.isCancel(url)) { if (await confirmCancel()) cancel(); return stepProvider(state); }
    baseUrl = url as string;
    if (type === 'custom') {
      const key = await p.password({ message: 'Clé API (laisser vide si non requise) :' });
      if (!p.isCancel(key) && key) apiKey = key as string;
    }
  }

  const models = PROVIDER_MODELS[type];
  if (models.length > 0) {
    const modelChoice = await p.select({
      message: 'Modèle :',
      options: [
        ...models.map(m => ({ value: m, label: m })),
        { value: '__custom__', label: 'Autre (saisir manuellement)' },
      ],
    });
    if (p.isCancel(modelChoice)) { if (await confirmCancel()) cancel(); return stepProvider(state); }
    if (modelChoice === '__custom__') {
      const custom = await p.text({ message: 'Nom du modèle :', validate: v => (!v ? 'Requis' : undefined) });
      if (p.isCancel(custom)) { if (await confirmCancel()) cancel(); return stepProvider(state); }
      model = custom as string;
    } else {
      model = modelChoice as string;
    }
  } else {
    const custom = await p.text({ message: 'Nom du modèle :', validate: v => (!v ? 'Requis' : undefined) });
    if (p.isCancel(custom)) { if (await confirmCancel()) cancel(); return stepProvider(state); }
    model = custom as string;
  }

  return { action: 'next', data: { type, apiKey, baseUrl, model } };
}

async function stepProjectName(state: DevState): Promise<StepResult<string>> {
  p.intro(chalk.bold('② Nom du projet'));

  const nameResult = await p.text({
    message: 'Nom du projet :',
    placeholder: process.cwd().split(/[/\\]/).pop() ?? 'mon-projet',
    defaultValue: state.projectName ?? process.cwd().split(/[/\\]/).pop() ?? 'mon-projet',
  });
  if (p.isCancel(nameResult)) { if (await confirmCancel()) cancel(); return stepProjectName(state); }

  const confirm = await p.select({
    message: `Projet : "${nameResult}"`,
    options: [
      { value: 'ok',     label: '✓  Continuer' },
      { value: 'back',   label: '←  Changer de provider' },
      { value: 'cancel', label: '✗  Annuler' },
    ],
  });
  if (p.isCancel(confirm) || confirm === 'cancel') { if (await confirmCancel()) cancel(); return stepProjectName(state); }
  if (confirm === 'back') return { action: 'back' };
  return { action: 'next', data: nameResult as string };
}

async function stepInput(state: DevState, filePath?: string): Promise<StepResult<string>> {
  p.intro(chalk.bold('③ Description du projet'));

  let input = '';

  if (filePath) {
    const spinner = p.spinner();
    spinner.start(`Lecture de ${filePath}...`);
    try {
      input = await readCahierDesCharges(filePath);
      spinner.stop(`Fichier lu — ${input.length} caractères`);
      console.log(chalk.dim(input.slice(0, 300) + (input.length > 300 ? '...' : '')));
    } catch (e) {
      spinner.stop('Erreur de lecture');
      console.log(chalk.red((e as Error).message));
    }
  }

  const manualResult = await p.text({
    message: filePath
      ? 'Ajouter des précisions au cahier des charges ? (Entrée pour ignorer) :'
      : 'Décris ton projet :',
    placeholder: filePath
      ? 'Contraintes, stack préférée, détails supplémentaires...'
      : 'Une app de gestion de tâches avec authentification et tableau de bord...',
    defaultValue: state.input && !filePath ? state.input : undefined,
  });
  if (!p.isCancel(manualResult) && manualResult) {
    input = input ? `${input}\n\n---\nPrécisions :\n${manualResult}` : (manualResult as string);
  }

  if (!input.trim()) {
    console.log(chalk.red('  Description requise.'));
    return stepInput(state, filePath);
  }

  const confirm = await p.select({
    message: 'Description prête ?',
    options: [
      { value: 'ok',     label: '✓  Continuer vers la spec' },
      { value: 'redo',   label: '↺  Réécrire la description' },
      { value: 'back',   label: '←  Changer le nom du projet' },
      { value: 'cancel', label: '✗  Annuler' },
    ],
  });
  if (p.isCancel(confirm) || confirm === 'cancel') { if (await confirmCancel()) cancel(); return stepInput(state, filePath); }
  if (confirm === 'back') return { action: 'back' };
  if (confirm === 'redo') return stepInput({ ...state, input: undefined }, filePath);
  return { action: 'next', data: input };
}

async function stepSpec(provider: ReturnType<typeof createProvider>, state: DevState): Promise<StepResult<string>> {
  p.intro(chalk.bold('④ Spécification fonctionnelle'));

  let additions = '';
  let spec = state.spec ?? '';

  while (true) {
    const spinner = p.spinner();
    spinner.start('Génération de la spec...');
    const prompt = `Voici la description du projet :\n\n${state.input}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nGénère une spécification fonctionnelle complète en markdown : scénarios utilisateur, exigences fonctionnelles, critères de succès, hors périmètre.`;
    spinner.stop('Spec générée :');
    spec = await streamToConsole(provider, prompt, SYSTEM_SPEC);

    const action = await actionMenu('Spécification', true);

    if (action === 'cancel') { if (await confirmCancel()) cancel(); continue; }
    if (action === 'back') return { action: 'back' };
    if (action === 'ok') return { action: 'next', data: spec };

    if (action === 'refine') {
      const add = await p.text({ message: 'Précisions pour la spec :', placeholder: 'Contrainte de sécurité, persona spécifique...' });
      if (!p.isCancel(add) && add) additions = add as string;
      continue;
    }

    if (action === 'edit') {
      writeFileSync(join(state.featureDir!, 'spec.md'), spec, 'utf-8');
      console.log(chalk.yellow(`\nÉdite le fichier puis reviens ici :\n  ${join(state.featureDir!, 'spec.md')}`));
      await p.text({ message: 'Appuie sur Entrée quand tu as terminé...' });
      spec = readFileSync(join(state.featureDir!, 'spec.md'), 'utf-8');
      return { action: 'next', data: spec };
    }
  }
}

async function stepPlan(provider: ReturnType<typeof createProvider>, state: DevState): Promise<StepResult<string>> {
  p.intro(chalk.bold('⑤ Plan technique'));

  let additions = '';
  let plan = state.plan ?? '';

  while (true) {
    const spinner = p.spinner();
    spinner.start('Génération du plan...');
    const prompt = `Spec :\n${state.spec}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nGénère un plan technique : stack, architecture, structure des dossiers, composants, API/endpoints.`;
    spinner.stop('Plan généré :');
    plan = await streamToConsole(provider, prompt, SYSTEM_PLAN);

    const action = await actionMenu('Plan technique', true);

    if (action === 'cancel') { if (await confirmCancel()) cancel(); continue; }
    if (action === 'back') return { action: 'back' };
    if (action === 'ok') return { action: 'next', data: plan };

    if (action === 'refine') {
      const add = await p.text({ message: 'Précisions pour le plan :', placeholder: 'Stack spécifique, contrainte infra...' });
      if (!p.isCancel(add) && add) additions = add as string;
      continue;
    }

    if (action === 'edit') {
      writeFileSync(join(state.featureDir!, 'plan.md'), plan, 'utf-8');
      console.log(chalk.yellow(`\nÉdite :\n  ${join(state.featureDir!, 'plan.md')}`));
      await p.text({ message: 'Entrée quand terminé...' });
      plan = readFileSync(join(state.featureDir!, 'plan.md'), 'utf-8');
      return { action: 'next', data: plan };
    }
  }
}

async function stepTasks(provider: ReturnType<typeof createProvider>, state: DevState): Promise<StepResult<string>> {
  p.intro(chalk.bold('⑥ Tâches de développement'));

  let additions = '';
  let tasks = state.tasks ?? '';

  while (true) {
    const spinner = p.spinner();
    spinner.start('Génération des tâches...');
    const prompt = `Spec :\n${state.spec}\n\nPlan :\n${state.plan}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nDécompose en tâches ordonnées, groupées par composant, avec checkboxes markdown.`;
    spinner.stop('Tâches générées :');
    tasks = await streamToConsole(provider, prompt, SYSTEM_TASKS);

    const action = await actionMenu('Tâches', true);

    if (action === 'cancel') { if (await confirmCancel()) cancel(); continue; }
    if (action === 'back') return { action: 'back' };
    if (action === 'ok') return { action: 'next', data: tasks };

    if (action === 'refine') {
      const add = await p.text({ message: 'Précisions pour les tâches :', placeholder: 'Ordre de priorité, tâche manquante...' });
      if (!p.isCancel(add) && add) additions = add as string;
      continue;
    }

    if (action === 'edit') {
      writeFileSync(join(state.featureDir!, 'tasks.md'), tasks, 'utf-8');
      console.log(chalk.yellow(`\nÉdite :\n  ${join(state.featureDir!, 'tasks.md')}`));
      await p.text({ message: 'Entrée quand terminé...' });
      tasks = readFileSync(join(state.featureDir!, 'tasks.md'), 'utf-8');
      return { action: 'next', data: tasks };
    }
  }
}

async function stepImplement(provider: ReturnType<typeof createProvider>, state: DevState): Promise<StepResult<void>> {
  p.intro(chalk.bold('⑦ Implémentation'));

  const proceed = await p.select({
    message: 'Lancer l\'implémentation autonome ?',
    options: [
      { value: 'ok',     label: '✓  Oui, écrire le code' },
      { value: 'back',   label: '←  Revoir les tâches' },
      { value: 'cancel', label: '✗  Annuler' },
    ],
  });
  if (p.isCancel(proceed) || proceed === 'cancel') { if (await confirmCancel()) cancel(); return stepImplement(provider, state); }
  if (proceed === 'back') return { action: 'back' };

  const add = await p.text({
    message: 'Précisions pour l\'implémentation ? (Entrée pour ignorer) :',
    placeholder: 'Framework UI, version Node, contraintes spécifiques...',
  });
  const additions = (!p.isCancel(add) && add) ? add as string : '';

  const spinner = p.spinner();
  spinner.start('Implémentation en cours...');
  const prompt = `Spec :\n${state.spec}\n\nPlan :\n${state.plan}\n\nTâches :\n${state.tasks}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nImplémente le projet complet. Pour chaque fichier :\n\n## Fichier: chemin/relatif/fichier.ext\n\`\`\`\n[contenu]\n\`\`\`\n\nGénère TOUS les fichiers pour un projet fonctionnel.`;
  spinner.stop('Code généré :');

  const code = await streamToConsole(provider, prompt, SYSTEM_CODE);
  writeFileSync(join(state.featureDir!, 'implement.md'), code, 'utf-8');

  // Écriture des fichiers sur disque
  const blocks = [...code.matchAll(/## Fichier:\s*(.+?)\n```(?:\w+)?\n([\s\S]+?)```/g)];
  let written = 0;
  for (const [, filePath, content] of blocks) {
    const fullPath = join(process.cwd(), filePath.trim());
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
    console.log(chalk.green(`  ✓ ${filePath.trim()}`));
    written++;
  }

  if (written === 0) {
    console.log(chalk.yellow('  Aucun fichier extrait — l\'IA n\'a pas utilisé le format ## Fichier:'));
    console.log(chalk.dim(`  Le code complet est dans : ${join(state.featureDir!, 'implement.md')}`));
  } else {
    console.log(chalk.green(`\n  ${written} fichier(s) créé(s) dans le projet`));
  }

  return { action: 'next', data: undefined };
}

// ─── Machine à états ──────────────────────────────────────────────────────────

export async function runDev(opts: { file?: string }): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('SANDYKIT Dev — Agent autonome spec → code'));

  const state: DevState = {};
  let step = 0;

  while (step <= 6) {
    switch (step) {
      case 0: { // Provider
        const res = await stepProvider(state);
        if (res.action === 'cancel') return;
        if (res.action === 'next') {
          state.providerCfg = res.data;
          const existingCfg = loadConfig();
          saveConfig({ ...(existingCfg ?? {}), provider: res.data });
          step++;
        }
        break;
      }

      case 1: { // Nom du projet
        const res = await stepProjectName(state);
        if (res.action === 'back') { step--; break; }
        if (res.action === 'next') { state.projectName = res.data; step++; }
        break;
      }

      case 2: { // Input
        // Crée le dossier feature dès qu'on a le nom
        if (!state.featureDir) {
          const specsDir = join(process.cwd(), 'specs');
          const existing = existsSync(specsDir) ? readdirSync(specsDir).filter(d => /^\d{3}-/.test(d)) : [];
          const nextNum = existing.length > 0 ? Math.max(...existing.map(d => parseInt(d.slice(0, 3), 10))) + 1 : 1;
          const pad = String(nextNum).padStart(3, '0');
          const slug = (state.projectName ?? 'projet').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          state.featureDir = join(specsDir, `${pad}-${slug}`);
          mkdirSync(state.featureDir, { recursive: true });
        }
        const res = await stepInput(state, opts.file);
        if (res.action === 'back') { step--; break; }
        if (res.action === 'next') { state.input = res.data; step++; }
        break;
      }

      case 3: { // Spec
        const provider = createProvider(state.providerCfg!);
        const res = await stepSpec(provider, state);
        if (res.action === 'back') { step--; break; }
        if (res.action === 'next') {
          state.spec = res.data;
          writeFileSync(join(state.featureDir!, 'spec.md'), state.spec, 'utf-8');
          console.log(chalk.green('  ✓ spec.md sauvegardé'));
          step++;
        }
        break;
      }

      case 4: { // Plan
        const provider = createProvider(state.providerCfg!);
        const res = await stepPlan(provider, state);
        if (res.action === 'back') { step--; break; }
        if (res.action === 'next') {
          state.plan = res.data;
          writeFileSync(join(state.featureDir!, 'plan.md'), state.plan, 'utf-8');
          console.log(chalk.green('  ✓ plan.md sauvegardé'));
          step++;
        }
        break;
      }

      case 5: { // Tâches
        const provider = createProvider(state.providerCfg!);
        const res = await stepTasks(provider, state);
        if (res.action === 'back') { step--; break; }
        if (res.action === 'next') {
          state.tasks = res.data;
          writeFileSync(join(state.featureDir!, 'tasks.md'), state.tasks, 'utf-8');
          console.log(chalk.green('  ✓ tasks.md sauvegardé'));
          step++;
        }
        break;
      }

      case 6: { // Implémentation
        const provider = createProvider(state.providerCfg!);
        const res = await stepImplement(provider, state);
        if (res.action === 'back') { step--; break; }
        if (res.action === 'next') { step++; }
        break;
      }
    }
  }

  const slug = (state.projectName ?? 'projet').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  p.outro(chalk.green(`✓ Projet "${state.projectName}" livré — specs dans ${state.featureDir?.replace(process.cwd(), '.')}`));
}
