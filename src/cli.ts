import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { showBanner } from './banner.js';
import { saveConfig, loadConfig } from './config.js';
import { install, getIntegrationPaths } from './installer.js';
import { startWatcher, getAllFeatureStatuses } from './watcher.js';
import type { Integration, FeatureStatus } from './types.js';
import { mkdirSync, writeFileSync, existsSync, readdirSync, rmSync, copyFileSync, renameSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { runDev } from './dev.js';

const _dirname: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath((import.meta as { url?: string }).url ?? ''));

export function buildStatusDisplay(features: FeatureStatus[]): string {
  if (features.length === 0) {
    return chalk.yellow('Aucune feature trouvée dans specs/');
  }

  const lines = features.map(f => {
    const stages = [
      f.hasSpec      ? chalk.green('spec ✓')   : chalk.dim('spec ○'),
      f.hasPlan      ? chalk.green('plan ✓')   : chalk.dim('plan ○'),
      f.hasTasks     ? chalk.green('tasks ✓')  : chalk.dim('tasks ○'),
      f.hasImplement ? chalk.green('impl ✓')   : chalk.dim('impl ○'),
      f.hasReview    ? chalk.green('review ✓') : chalk.dim('review ○'),
    ];
    return `  ${chalk.cyan(f.id.padEnd(25))} ${stages.join('  ')}`;
  });

  return lines.join('\n');
}

async function runInit(projet: string | undefined, opts: { integration: string }): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Initialisation du projet'));

  const valid: Integration[] = ['claude', 'cursor', 'copilot'];

  const agentOptions = [
    { value: 'claude'  as Integration, label: 'Claude Code',     hint: '.claude/commands/' },
    { value: 'cursor'  as Integration, label: 'Cursor',           hint: '.cursor/rules/' },
    { value: 'copilot' as Integration, label: 'GitHub Copilot',  hint: '.github/instructions/' },
  ];

  let projectName: string;
  let integrations: Integration[];

  // Boucle principale — retour au nom du projet
  outerLoop: while (true) {
    const nameResult = await p.text({
      message: 'Nom du projet :',
      placeholder: projet ?? process.cwd().split(/[/\\]/).pop() ?? 'mon-projet',
      defaultValue: projet ?? process.cwd().split(/[/\\]/).pop() ?? 'mon-projet',
    });
    if (p.isCancel(nameResult)) { p.cancel('Annulé'); process.exit(0); }
    projectName = nameResult as string;

    // Boucle interne — retour au choix des agents uniquement
    while (true) {
      const intResult = await p.multiselect<Integration>({
        message: 'Agents IA à intégrer : (espace = sélectionner, entrée = valider)',
        options: agentOptions,
        initialValues: [],
        required: true,
      });
      if (p.isCancel(intResult)) { p.cancel('Annulé'); process.exit(0); }
      integrations = intResult as Integration[];

      const agentLabels = integrations
        .map(i => agentOptions.find(o => o.value === i)?.label ?? i)
        .join(', ');

      const confirm = await p.select({
        message: `Projet "${projectName}" · Agents : ${agentLabels}`,
        options: [
          { value: 'confirm', label: '✓  Confirmer et installer' },
          { value: 'agents',  label: '↩  Choisir un autre agent' },
          { value: 'restart', label: '⟳  Recommencer depuis le début' },
          { value: 'cancel',  label: '✗  Annuler' },
        ],
      });

      if (p.isCancel(confirm) || confirm === 'cancel') {
        const sure = await p.confirm({
          message: 'Voulez-vous vraiment annuler ?',
          initialValue: false,
        });
        if (p.isCancel(sure) || sure) { p.cancel('Annulé'); process.exit(0); }
        // réponse "non" → on reste dans la boucle, on réaffiche la confirmation
        continue;
      }

      if (confirm === 'restart') {
        console.log(chalk.dim('\nRetour au début...\n'));
        continue outerLoop;
      }

      if (confirm === 'agents') {
        console.log(chalk.dim('\nRetour au choix des agents...\n'));
        continue;
      }

      // confirm === 'confirm'
      break outerLoop;
    }
  }

  const spinner = p.spinner();
  spinner.start('Installation des commandes...');
  await install(integrations);
  saveConfig({ projectName, integrations });
  spinner.stop('Commandes installées');

  const agentPaths: Record<string, string> = {
    claude:  '.claude/commands/',
    cursor:  '.cursor/rules/',
    copilot: '.github/instructions/',
  };

  p.note(
    integrations.map(i => `${chalk.bold(i.padEnd(10))} → ${chalk.dim(agentPaths[i] ?? '')}`).join('\n'),
    'Intégrations installées'
  );

  p.note(
    [
      chalk.bold('— Agent IA —'),
      chalk.cyan('/sandykit.specify')    + '    Décrire une nouvelle feature',
      chalk.cyan('/sandykit.clarify')    + '    Affiner une spec floue',
      chalk.cyan('/sandykit.plan')       + '       Générer le plan technique',
      chalk.cyan('/sandykit.tasks')      + '      Décomposer en tâches',
      chalk.cyan('/sandykit.implement')  + '  Implémenter les tâches',
      chalk.cyan('/sandykit.review')     + '     Réviser le code',
      chalk.cyan('/sandykit.back')       + '       Revenir à l\'étape précédente',
      '',
      chalk.bold('— Terminal —'),
      chalk.yellow('sandykit new')       + '      Créer une feature sans agent',
      chalk.yellow('sandykit reset')     + '    Réinitialiser une feature',
      chalk.yellow('sandykit export')    + '   Exporter une feature',
      chalk.yellow('sandykit update')    + '   Mettre à jour les commandes',
      chalk.yellow('sandykit status')    + '   État des features',
      chalk.yellow('sandykit list')      + '     Lister les features',
    ].join('\n'),
    'Commandes disponibles'
  );

  p.outro(chalk.green(`✓ SANDYKIT prêt dans "${projectName}"`));
}

async function runNew(nom: string | undefined): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Nouvelle feature'));

  const nameResult = await p.text({
    message: 'Nom de la feature :',
    placeholder: nom ?? 'auth-jwt',
    defaultValue: nom,
    validate: v => (v.trim().length === 0 ? 'Le nom est requis' : undefined),
  });
  if (p.isCancel(nameResult)) { p.cancel('Annulé'); process.exit(0); }
  const featureName = (nameResult as string).trim().toLowerCase().replace(/\s+/g, '-');

  const specsDir = join(process.cwd(), 'specs');
  let nextNum = 1;
  if (existsSync(specsDir)) {
    const existing = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d));
    if (existing.length > 0) {
      nextNum = Math.max(...existing.map(d => parseInt(d.slice(0, 3), 10))) + 1;
    }
  }
  const pad = String(nextNum).padStart(3, '0');
  const featureDir = join(specsDir, `${pad}-${featureName}`);

  if (existsSync(featureDir)) {
    p.cancel(`La feature "${pad}-${featureName}" existe déjà.`);
    process.exit(1);
  }

  const spinner = p.spinner();
  spinner.start('Création de la feature...');
  mkdirSync(featureDir, { recursive: true });
  const today = new Date().toISOString().split('T')[0];
  writeFileSync(join(featureDir, 'spec.md'),
    `# Spécification : ${featureName}\n\n**Créé** : ${today}\n**Statut** : Brouillon\n**Dossier** : \`specs/${pad}-${featureName}/\`\n\n## Scénarios utilisateur\n\n<!-- Décris le parcours utilisateur ici -->\n\n## Exigences fonctionnelles\n\n- [ ] \n\n## Critères de succès\n\n- \n\n## Hors périmètre\n\n- \n`,
    'utf-8'
  );
  spinner.stop('Feature créée');

  p.note(`specs/${pad}-${featureName}/spec.md`, `Feature "${featureName}" initialisée`);
  p.outro(chalk.green(`✓ Lance /sandykit.specify dans ton agent IA pour remplir la spec`));
}

async function runReset(nom: string | undefined): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Réinitialiser une feature'));

  const specsDir = join(process.cwd(), 'specs');
  if (!existsSync(specsDir)) {
    p.cancel('Aucun dossier specs/ trouvé.');
    process.exit(1);
  }

  const features = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d));
  if (features.length === 0) {
    p.cancel('Aucune feature trouvée dans specs/.');
    process.exit(1);
  }

  let target: string;
  if (nom) {
    const match = features.find(f => f.includes(nom));
    if (!match) { p.cancel(`Feature "${nom}" non trouvée.`); process.exit(1); }
    target = match;
  } else {
    const choice = await p.select({
      message: 'Quelle feature réinitialiser ?',
      options: features.map(f => ({ value: f, label: f })),
    });
    if (p.isCancel(choice)) { p.cancel('Annulé'); process.exit(0); }
    target = choice as string;
  }

  const stepOptions = [
    { value: 'spec',     label: 'spec.md     — Supprimer et recommencer la spec' },
    { value: 'plan',     label: 'plan.md     — Supprimer le plan et les suivants' },
    { value: 'tasks',    label: 'tasks.md    — Supprimer les tâches et les suivants' },
    { value: 'implement',label: 'implement.md — Supprimer l\'implémentation et review' },
    { value: 'review',   label: 'review.md   — Supprimer uniquement la review' },
    { value: 'all',      label: 'TOUT        — Supprimer toute la feature' },
  ];

  const step = await p.select({ message: `Que supprimer dans "${target}" ?`, options: stepOptions });
  if (p.isCancel(step)) { p.cancel('Annulé'); process.exit(0); }

  const confirm = await p.confirm({
    message: chalk.red(`Confirmer la suppression de "${step}" dans "${target}" ?`),
    initialValue: false,
  });
  if (p.isCancel(confirm) || !confirm) { p.cancel('Annulé'); process.exit(0); }

  const featureDir = join(specsDir, target);
  const order = ['spec', 'plan', 'tasks', 'implement', 'review'];
  const toDelete = step === 'all' ? null : order.slice(order.indexOf(step as string));

  if (toDelete === null) {
    rmSync(featureDir, { recursive: true, force: true });
    p.outro(chalk.yellow(`✓ Feature "${target}" entièrement supprimée`));
  } else {
    for (const s of toDelete) {
      const f = join(featureDir, `${s}.md`);
      if (existsSync(f)) rmSync(f);
    }
    p.outro(chalk.yellow(`✓ Étapes supprimées dans "${target}"`));
  }
}

async function runUpdate(): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Mise à jour des commandes'));

  const cfg = loadConfig();
  if (!cfg) {
    p.cancel('Projet non initialisé. Lance sandykit init d\'abord.');
    process.exit(1);
  }

  const spinner = p.spinner();
  spinner.start(`Mise à jour pour ${cfg.integrations.join(', ')}...`);
  await install(cfg.integrations);
  spinner.stop('Commandes mises à jour');

  p.outro(chalk.green(`✓ Commandes mises à jour dans ${cfg.integrations.length} intégration(s)`));
}

async function runExport(nom: string | undefined): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Exporter une feature'));

  const specsDir = join(process.cwd(), 'specs');
  if (!existsSync(specsDir)) { p.cancel('Aucun dossier specs/ trouvé.'); process.exit(1); }

  const features = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d));
  if (features.length === 0) { p.cancel('Aucune feature trouvée.'); process.exit(1); }

  let target: string;
  if (nom) {
    const match = features.find(f => f.includes(nom));
    if (!match) { p.cancel(`Feature "${nom}" non trouvée.`); process.exit(1); }
    target = match;
  } else {
    const choice = await p.select({
      message: 'Quelle feature exporter ?',
      options: features.map(f => ({ value: f, label: f })),
    });
    if (p.isCancel(choice)) { p.cancel('Annulé'); process.exit(0); }
    target = choice as string;
  }

  const exportDir = join(process.cwd(), 'exports');
  if (!existsSync(exportDir)) mkdirSync(exportDir, { recursive: true });
  const destDir = join(exportDir, target);
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  const spinner = p.spinner();
  spinner.start('Export en cours...');

  const files = ['spec.md', 'plan.md', 'tasks.md', 'implement.md', 'review.md'];
  let count = 0;
  for (const file of files) {
    const src = join(specsDir, target, file);
    if (existsSync(src)) {
      copyFileSync(src, join(destDir, file));
      count++;
    }
  }
  spinner.stop(`${count} fichier(s) exporté(s)`);

  p.note(`exports/${target}/`, 'Dossier d\'export');
  p.outro(chalk.green(`✓ Feature "${target}" exportée`));
}

async function runOpen(nom: string | undefined): Promise<void> {
  showBanner();

  const specsDir = join(process.cwd(), 'specs');
  if (!existsSync(specsDir)) { p.cancel('Aucun dossier specs/ trouvé.'); process.exit(1); }

  const features = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d));
  if (features.length === 0) { p.cancel('Aucune feature trouvée.'); process.exit(1); }

  let target: string;
  if (nom) {
    const match = features.find(f => f.includes(nom));
    if (!match) { p.cancel(`Feature "${nom}" non trouvée.`); process.exit(1); }
    target = match;
  } else {
    const choice = await p.select({
      message: 'Quelle feature ouvrir ?',
      options: features.map(f => ({ value: f, label: f })),
    });
    if (p.isCancel(choice)) { p.cancel('Annulé'); process.exit(0); }
    target = choice as string;
  }

  const featureDir = join(specsDir, target);
  const platform = process.platform;
  try {
    if (platform === 'win32') execSync(`explorer "${featureDir}"`);
    else if (platform === 'darwin') execSync(`open "${featureDir}"`);
    else execSync(`xdg-open "${featureDir}"`);
    console.log(chalk.green(`✓ Ouvert : specs/${target}/`));
  } catch {
    console.log(chalk.yellow(`Chemin : ${featureDir}`));
  }
}

async function runRename(nom: string | undefined): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Renommer une feature'));

  const specsDir = join(process.cwd(), 'specs');
  if (!existsSync(specsDir)) { p.cancel('Aucun dossier specs/ trouvé.'); process.exit(1); }

  const features = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d));
  if (features.length === 0) { p.cancel('Aucune feature trouvée.'); process.exit(1); }

  let target: string;
  if (nom) {
    const match = features.find(f => f.includes(nom));
    if (!match) { p.cancel(`Feature "${nom}" non trouvée.`); process.exit(1); }
    target = match;
  } else {
    const choice = await p.select({
      message: 'Quelle feature renommer ?',
      options: features.map(f => ({ value: f, label: f })),
    });
    if (p.isCancel(choice)) { p.cancel('Annulé'); process.exit(0); }
    target = choice as string;
  }

  const currentNum = target.slice(0, 3);
  const currentName = target.slice(4);

  const newNameResult = await p.text({
    message: 'Nouveau nom (sans numéro) :',
    placeholder: currentName,
    validate: v => (v.trim().length === 0 ? 'Le nom est requis' : undefined),
  });
  if (p.isCancel(newNameResult)) { p.cancel('Annulé'); process.exit(0); }
  const newName = (newNameResult as string).trim().toLowerCase().replace(/\s+/g, '-');

  const newDirName = `${currentNum}-${newName}`;
  if (newDirName === target) { p.cancel('Nom identique, rien à faire.'); process.exit(0); }

  const oldPath = join(specsDir, target);
  const newPath = join(specsDir, newDirName);

  if (existsSync(newPath)) { p.cancel(`"${newDirName}" existe déjà.`); process.exit(1); }

  const spinner = p.spinner();
  spinner.start('Renommage...');
  renameSync(oldPath, newPath);

  // Update spec.md header if it exists
  const specFile = join(newPath, 'spec.md');
  if (existsSync(specFile)) {
    const content = readFileSync(specFile, 'utf-8');
    writeFileSync(specFile, content.replace(
      /\*\*Dossier\*\* : `specs\/[^`]+`/,
      `**Dossier** : \`specs/${newDirName}/\``
    ), 'utf-8');
  }
  spinner.stop('Renommée');

  p.outro(chalk.green(`✓ "${target}" → "${newDirName}"`));
}

async function runArchive(nom: string | undefined): Promise<void> {
  showBanner();
  p.intro(chalk.cyan('Archiver une feature'));

  const specsDir = join(process.cwd(), 'specs');
  if (!existsSync(specsDir)) { p.cancel('Aucun dossier specs/ trouvé.'); process.exit(1); }

  const features = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d));
  if (features.length === 0) { p.cancel('Aucune feature trouvée.'); process.exit(1); }

  let target: string;
  if (nom) {
    const match = features.find(f => f.includes(nom));
    if (!match) { p.cancel(`Feature "${nom}" non trouvée.`); process.exit(1); }
    target = match;
  } else {
    const choice = await p.select({
      message: 'Quelle feature archiver ?',
      options: features.map(f => ({ value: f, label: f })),
    });
    if (p.isCancel(choice)) { p.cancel('Annulé'); process.exit(0); }
    target = choice as string;
  }

  const confirm = await p.confirm({
    message: `Archiver "${target}" ? (déplacé hors de specs/)`,
    initialValue: true,
  });
  if (p.isCancel(confirm) || !confirm) { p.cancel('Annulé'); process.exit(0); }

  const archivesDir = join(process.cwd(), 'archives');
  if (!existsSync(archivesDir)) mkdirSync(archivesDir, { recursive: true });

  const src = join(specsDir, target);
  const dest = join(archivesDir, target);

  if (existsSync(dest)) { p.cancel(`"${target}" existe déjà dans archives/.`); process.exit(1); }

  const spinner = p.spinner();
  spinner.start('Archivage...');
  renameSync(src, dest);
  spinner.stop('Archivée');

  p.outro(chalk.green(`✓ "${target}" déplacé dans archives/`));
}

function runDoctor(): void {
  showBanner();
  console.log(chalk.bold('Diagnostic SANDYKIT\n'));

  const cwd = process.cwd();
  const checks: Array<{ label: string; ok: boolean; detail?: string }> = [];

  // Config
  const cfg = loadConfig();
  checks.push({ label: 'Configuration .sandykit/config.json', ok: cfg !== null, detail: cfg ? `projet: ${cfg.projectName}` : 'non trouvée — lance sandykit init' });

  // specs/
  const specsDir = join(cwd, 'specs');
  checks.push({ label: 'Dossier specs/', ok: existsSync(specsDir) });

  // Agent integrations
  const agentPaths: Record<string, string> = {
    claude:  join(cwd, '.claude', 'commands'),
    cursor:  join(cwd, '.cursor', 'rules'),
    copilot: join(cwd, '.github', 'instructions'),
  };
  const commands = ['specify', 'clarify', 'plan', 'tasks', 'implement', 'review', 'back'];
  const extensions: Record<string, string> = { claude: '.md', cursor: '.mdc', copilot: '.instructions.md' };

  if (cfg) {
    for (const integration of cfg.integrations) {
      const dir = agentPaths[integration];
      checks.push({ label: `Dossier ${integration}`, ok: existsSync(dir), detail: dir.replace(cwd, '.') });

      let missing = 0;
      for (const cmd of commands) {
        const file = join(dir, `sandykit.${cmd}${extensions[integration]}`);
        if (!existsSync(file)) missing++;
      }
      checks.push({
        label: `Commandes ${integration} (${commands.length - missing}/${commands.length})`,
        ok: missing === 0,
        detail: missing > 0 ? `${missing} manquante(s) — lance sandykit update` : undefined,
      });
    }
  } else {
    checks.push({ label: 'Intégrations agents', ok: false, detail: 'config manquante' });
  }

  // Print results
  for (const { label, ok, detail } of checks) {
    const icon = ok ? chalk.green('✓') : chalk.red('✗');
    const text = ok ? chalk.white(label) : chalk.red(label);
    const hint = detail ? chalk.dim(`  ${detail}`) : '';
    console.log(`  ${icon}  ${text}${hint}`);
  }

  const allOk = checks.every(c => c.ok);
  console.log();
  if (allOk) {
    console.log(chalk.green('✓ SANDYKIT est correctement configuré'));
  } else {
    console.log(chalk.yellow('⚠ Des éléments nécessitent attention (voir ci-dessus)'));
  }
  console.log();
}

const program = new Command();

program
  .name('sandykit')
  .description('Spec-Driven Development pour agents IA')
  .version('2.0.0');

program
  .command('init [projet]')
  .description('Initialiser SANDYKIT dans le projet courant')
  .option('--integration <liste>', 'Intégrations : claude,cursor,copilot', 'claude')
  .action(runInit);

program
  .command('watch')
  .description('Surveiller les specs et valider le pipeline')
  .action(() => {
    showBanner();
    startWatcher();
  });

program
  .command('status')
  .description("Afficher l'état des features en cours")
  .action(() => {
    showBanner();
    const features = getAllFeatureStatuses('specs');
    const cfg = loadConfig();
    if (cfg) console.log(chalk.bold(`Projet : ${cfg.projectName}\n`));
    console.log('─'.repeat(70));
    console.log(buildStatusDisplay(features));
    console.log('─'.repeat(70) + '\n');
  });

program
  .command('list')
  .description('Lister toutes les features')
  .action(() => {
    showBanner();
    const features = getAllFeatureStatuses('specs');
    if (features.length === 0) {
      console.log(chalk.yellow('Aucune feature trouvée.'));
      return;
    }
    console.log(chalk.bold('Features :\n'));
    for (const f of features) {
      const done = [f.hasSpec, f.hasPlan, f.hasTasks, f.hasImplement, f.hasReview]
        .filter(Boolean).length;
      const bar = '█'.repeat(done) + '░'.repeat(5 - done);
      console.log(`  ${chalk.cyan(f.id.padEnd(25))} ${chalk.green(bar)}  ${done}/5 étapes`);
    }
    console.log();
  });

program
  .command('new [nom]')
  .description('Créer une nouvelle feature dans specs/')
  .action(runNew);

program
  .command('reset [nom]')
  .description('Réinitialiser ou supprimer une feature')
  .action(runReset);

program
  .command('update')
  .description('Mettre à jour les commandes installées dans les agents IA')
  .action(runUpdate);

program
  .command('export [nom]')
  .description('Exporter les fichiers d\'une feature dans exports/')
  .action(runExport);

program
  .command('dev')
  .description('Agent autonome : spec → plan → tâches → code (v3)')
  .option('--file <chemin>', 'Chemin vers un cahier des charges (.txt, .md, .pdf, .docx)')
  .option('--resume', 'Reprendre depuis le dernier checkpoint sauvegardé')
  .action((opts) => runDev(opts));

program
  .command('open [nom]')
  .description("Ouvrir le dossier d'une feature dans l'explorateur")
  .action(runOpen);

program
  .command('rename [nom]')
  .description('Renommer une feature')
  .action(runRename);

program
  .command('archive [nom]')
  .description("Archiver une feature terminée dans archives/")
  .action(runArchive);

program
  .command('doctor')
  .description('Vérifier la configuration et les fichiers installés')
  .action(runDoctor);

// Only parse CLI args when run directly (not when imported by tests)
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('cli.cjs'))) {
  program.parse();
}
