import * as p from '@clack/prompts';
import chalk from 'chalk';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { showBanner } from './banner.js';
import { createProvider, PROVIDER_MODELS, type ProviderConfig, type ProviderType } from './providers.js';
import { readCahierDesCharges } from './reader.js';
import { saveConfig, loadConfig } from './config.js';

// ─── System prompts ───────────────────────────────────────────────────────────

const SYSTEM_SPEC = `Tu es un expert en spécification fonctionnelle. Tu dois rédiger des specs claires, orientées valeur utilisateur, sans détails d'implémentation. Tes specs doivent être testables et mesurables. Réponds uniquement en markdown.`;

const SYSTEM_PLAN = `Tu es un architecte logiciel senior. Tu génères des plans techniques concis basés sur une spec fonctionnelle. Inclure : stack recommandée, structure des dossiers, composants principaux, flux de données. Réponds uniquement en markdown.`;

const SYSTEM_TASKS = `Tu es un tech lead. Tu décomposes un plan technique en tâches de développement précises, ordonnées, avec dépendances. Chaque tâche doit être réalisable en moins d'une journée. Réponds uniquement en markdown avec des checkboxes.`;

const SYSTEM_CODE = `Tu es un développeur senior full-stack. Tu implémentes du code propre, bien structuré, commenté uniquement quand nécessaire. Tu respectes exactement la structure définie dans le plan. Réponds avec le code complet, prêt à l'emploi.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function askUserAdditions(label: string): Promise<string> {
  const add = await p.text({
    message: `Ajouter des précisions pour ${label} ? (Entrée pour ignorer)`,
    placeholder: 'ex: contrainte de sécurité, technologie préférée...',
  });
  if (p.isCancel(add) || !add) return '';
  return add as string;
}

async function confirmOrRefine(label: string): Promise<'ok' | 'refine' | 'edit'> {
  const choice = await p.select({
    message: `${label} — que faire ?`,
    options: [
      { value: 'ok',     label: '✓  Valider et continuer' },
      { value: 'refine', label: '↺  Régénérer (l\'IA recommence)' },
      { value: 'edit',   label: '✏  Modifier manuellement le fichier' },
    ],
  });
  if (p.isCancel(choice)) { p.cancel('Annulé'); process.exit(0); }
  return choice as 'ok' | 'refine' | 'edit';
}

// ─── Provider setup ───────────────────────────────────────────────────────────

async function setupProvider(): Promise<ProviderConfig> {
  const cfg = loadConfig();
  // Réutilise le provider sauvegardé si disponible
  if (cfg?.provider) {
    const reuse = await p.confirm({
      message: `Utiliser le provider sauvegardé : ${chalk.cyan(cfg.provider.type)} (${cfg.provider.model ?? 'modèle par défaut'}) ?`,
      initialValue: true,
    });
    if (!p.isCancel(reuse) && reuse) return cfg.provider;
  }

  const providerType = await p.select({
    message: 'Quel provider IA utiliser ?',
    options: [
      { value: 'claude',  label: 'Claude (Anthropic)',     hint: 'API key requise' },
      { value: 'openai',  label: 'OpenAI (GPT-4o...)',     hint: 'API key requise' },
      { value: 'ollama',  label: 'Ollama (local)',          hint: 'Aucune clé, modèle local' },
      { value: 'custom',  label: 'Provider personnalisé',  hint: 'URL + clé compatible OpenAI' },
    ],
  });
  if (p.isCancel(providerType)) { p.cancel('Annulé'); process.exit(0); }
  const type = providerType as ProviderType;

  let apiKey: string | undefined;
  let baseUrl: string | undefined;
  let model: string | undefined;

  if (type === 'claude' || type === 'openai') {
    const key = await p.password({
      message: `Clé API ${type === 'claude' ? 'Anthropic' : 'OpenAI'} :`,
      validate: v => (v.trim().length < 10 ? 'Clé invalide' : undefined),
    });
    if (p.isCancel(key)) { p.cancel('Annulé'); process.exit(0); }
    apiKey = key as string;
  }

  if (type === 'ollama' || type === 'custom') {
    const url = await p.text({
      message: type === 'ollama' ? 'URL Ollama :' : 'URL du provider :',
      placeholder: type === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com',
      defaultValue: type === 'ollama' ? 'http://localhost:11434' : '',
    });
    if (p.isCancel(url)) { p.cancel('Annulé'); process.exit(0); }
    baseUrl = url as string;

    if (type === 'custom') {
      const key = await p.password({ message: 'Clé API (laisser vide si pas requise) :' });
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
    if (p.isCancel(modelChoice)) { p.cancel('Annulé'); process.exit(0); }
    if (modelChoice === '__custom__') {
      const custom = await p.text({ message: 'Nom du modèle :', validate: v => (!v ? 'Requis' : undefined) });
      if (p.isCancel(custom)) { p.cancel('Annulé'); process.exit(0); }
      model = custom as string;
    } else {
      model = modelChoice as string;
    }
  } else {
    const custom = await p.text({ message: 'Nom du modèle :', validate: v => (!v ? 'Requis' : undefined) });
    if (p.isCancel(custom)) { p.cancel('Annulé'); process.exit(0); }
    model = custom as string;
  }

  return { type, apiKey, baseUrl, model };
}

// ─── Étapes du pipeline ───────────────────────────────────────────────────────

async function stepSpec(provider: ReturnType<typeof createProvider>, input: string, featureDir: string): Promise<string> {
  p.intro(chalk.cyan('① Spécification fonctionnelle'));

  let spec = '';
  let additions = '';

  while (true) {
    const spinner = p.spinner();
    spinner.start('Génération de la spec...');
    const prompt = `Voici la description du projet :\n\n${input}${additions ? `\n\nPrécisions supplémentaires :\n${additions}` : ''}\n\nGénère une spécification fonctionnelle complète en markdown avec : scénarios utilisateur, exigences fonctionnelles, critères de succès, hors périmètre.`;
    spinner.stop('Spec générée :');
    spec = await streamToConsole(provider, prompt, SYSTEM_SPEC);

    const action = await confirmOrRefine('Spécification');
    if (action === 'ok') break;
    if (action === 'refine') {
      additions = (await askUserAdditions('la spec')) || additions;
      continue;
    }
    if (action === 'edit') {
      writeFileSync(join(featureDir, 'spec.md'), spec, 'utf-8');
      console.log(chalk.yellow(`\nModifie le fichier : ${join(featureDir, 'spec.md')}`));
      await p.text({ message: 'Appuie sur Entrée quand tu as fini de modifier...' });
      spec = readFileSync(join(featureDir, 'spec.md'), 'utf-8');
      break;
    }
  }

  writeFileSync(join(featureDir, 'spec.md'), spec, 'utf-8');
  console.log(chalk.green(`  ✓ spec.md sauvegardé`));
  return spec;
}

async function stepPlan(provider: ReturnType<typeof createProvider>, spec: string, featureDir: string): Promise<string> {
  p.intro(chalk.cyan('② Plan technique'));

  let plan = '';
  let additions = '';

  while (true) {
    const spinner = p.spinner();
    spinner.start('Génération du plan...');
    const prompt = `Voici la spécification fonctionnelle :\n\n${spec}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nGénère un plan technique détaillé : stack, architecture, structure des dossiers, composants principaux, API/endpoints si applicable.`;
    spinner.stop('Plan généré :');
    plan = await streamToConsole(provider, prompt, SYSTEM_PLAN);

    const action = await confirmOrRefine('Plan technique');
    if (action === 'ok') break;
    if (action === 'refine') {
      additions = (await askUserAdditions('le plan')) || additions;
      continue;
    }
    if (action === 'edit') {
      writeFileSync(join(featureDir, 'plan.md'), plan, 'utf-8');
      console.log(chalk.yellow(`\nModifie : ${join(featureDir, 'plan.md')}`));
      await p.text({ message: 'Entrée quand terminé...' });
      plan = readFileSync(join(featureDir, 'plan.md'), 'utf-8');
      break;
    }
  }

  writeFileSync(join(featureDir, 'plan.md'), plan, 'utf-8');
  console.log(chalk.green(`  ✓ plan.md sauvegardé`));
  return plan;
}

async function stepTasks(provider: ReturnType<typeof createProvider>, spec: string, plan: string, featureDir: string): Promise<string> {
  p.intro(chalk.cyan('③ Décomposition en tâches'));

  let tasks = '';
  let additions = '';

  while (true) {
    const spinner = p.spinner();
    spinner.start('Génération des tâches...');
    const prompt = `Spec :\n${spec}\n\nPlan :\n${plan}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nDécompose en tâches de développement ordonnées avec dépendances. Format : checkboxes markdown groupées par composant.`;
    spinner.stop('Tâches générées :');
    tasks = await streamToConsole(provider, prompt, SYSTEM_TASKS);

    const action = await confirmOrRefine('Tâches');
    if (action === 'ok') break;
    if (action === 'refine') {
      additions = (await askUserAdditions('les tâches')) || additions;
      continue;
    }
    if (action === 'edit') {
      writeFileSync(join(featureDir, 'tasks.md'), tasks, 'utf-8');
      console.log(chalk.yellow(`\nModifie : ${join(featureDir, 'tasks.md')}`));
      await p.text({ message: 'Entrée quand terminé...' });
      tasks = readFileSync(join(featureDir, 'tasks.md'), 'utf-8');
      break;
    }
  }

  writeFileSync(join(featureDir, 'tasks.md'), tasks, 'utf-8');
  console.log(chalk.green(`  ✓ tasks.md sauvegardé`));
  return tasks;
}

async function stepImplement(provider: ReturnType<typeof createProvider>, spec: string, plan: string, tasks: string, featureDir: string): Promise<void> {
  p.intro(chalk.cyan('④ Implémentation'));

  const proceed = await p.confirm({
    message: 'Lancer l\'implémentation autonome ? L\'IA va écrire le code selon le plan.',
    initialValue: true,
  });
  if (p.isCancel(proceed) || !proceed) {
    console.log(chalk.yellow('Implémentation ignorée. Tu peux relancer avec sandykit dev --resume'));
    return;
  }

  const additions = await askUserAdditions('l\'implémentation');

  const spinner = p.spinner();
  spinner.start('Implémentation en cours...');
  const prompt = `Spec :\n${spec}\n\nPlan :\n${plan}\n\nTâches :\n${tasks}${additions ? `\n\nPrécisions :\n${additions}` : ''}\n\nImplémente le projet complet. Pour chaque fichier, utilise ce format :\n\n## Fichier: chemin/relatif/fichier.ext\n\`\`\`\n[contenu du fichier]\n\`\`\`\n\nGénère TOUS les fichiers nécessaires pour que le projet soit fonctionnel.`;
  spinner.stop('Code généré :');

  const code = await streamToConsole(provider, prompt, SYSTEM_CODE);
  writeFileSync(join(featureDir, 'implement.md'), code, 'utf-8');

  // Extraire et écrire les fichiers de code
  const fileBlocks = [...code.matchAll(/## Fichier:\s*(.+?)\n```(?:\w+)?\n([\s\S]+?)```/g)];
  let written = 0;
  for (const [, filePath, content] of fileBlocks) {
    const fullPath = join(process.cwd(), filePath.trim());
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
    console.log(chalk.green(`  ✓ ${filePath.trim()}`));
    written++;
  }

  console.log(chalk.green(`\n  ${written} fichier(s) créé(s)`));
  console.log(chalk.green(`  ✓ implement.md sauvegardé`));
}

// ─── Commande principale ──────────────────────────────────────────────────────

export async function runDev(opts: { file?: string }): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('SANDYKIT Dev — Agent autonome spec-first'));

  // 1. Provider
  const providerCfg = await setupProvider();
  const provider = createProvider(providerCfg);

  // 2. Nom du projet
  const nameResult = await p.text({
    message: 'Nom du projet :',
    placeholder: process.cwd().split(/[/\\]/).pop() ?? 'mon-projet',
    defaultValue: process.cwd().split(/[/\\]/).pop() ?? 'mon-projet',
  });
  if (p.isCancel(nameResult)) { p.cancel('Annulé'); process.exit(0); }
  const projectName = nameResult as string;

  // Sauvegarde provider dans config
  const existingCfg = loadConfig();
  saveConfig({ ...(existingCfg ?? {}), projectName, provider: providerCfg });

  // 3. Input : fichier OU saisie manuelle OU les deux
  let input = '';

  if (opts.file) {
    const spinner = p.spinner();
    spinner.start(`Lecture du fichier ${opts.file}...`);
    try {
      input = await readCahierDesCharges(opts.file);
      spinner.stop(`Fichier lu (${input.length} caractères)`);
    } catch (e) {
      spinner.stop('Erreur de lecture');
      console.log(chalk.red((e as Error).message));
      process.exit(1);
    }
  }

  const manualResult = await p.text({
    message: opts.file
      ? 'Ajouter des précisions au cahier des charges ? (Entrée pour ignorer) :'
      : 'Décris ton projet :',
    placeholder: opts.file ? 'Contraintes, stack préférée...' : 'Une app de gestion de tâches avec authentification...',
  });
  if (!p.isCancel(manualResult) && manualResult) {
    input = input ? `${input}\n\n---\nPrécisions utilisateur :\n${manualResult}` : (manualResult as string);
  }

  if (!input.trim()) {
    p.cancel('Description requise. Utilise --file ou saisis une description.');
    process.exit(1);
  }

  // 4. Dossier de la feature
  const specsDir = join(process.cwd(), 'specs');
  const existing = existsSync(specsDir)
    ? readdirSync(specsDir).filter((d) => /^\d{3}-/.test(d))
    : [];
  const nextNum = existing.length > 0
    ? Math.max(...existing.map((d) => parseInt(d.slice(0, 3), 10))) + 1
    : 1;
  const pad = String(nextNum).padStart(3, '0');
  const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const featureDir = join(specsDir, `${pad}-${slug}`);
  mkdirSync(featureDir, { recursive: true });

  // 5. Pipeline
  const spec  = await stepSpec(provider, input, featureDir);
  const plan  = await stepPlan(provider, spec, featureDir);
  const tasks = await stepTasks(provider, spec, plan, featureDir);
  await stepImplement(provider, spec, plan, tasks, featureDir);

  p.outro(chalk.green(`✓ Projet "${projectName}" livré — specs dans specs/${pad}-${slug}/`));
}
