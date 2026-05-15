import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import { saveConfig, loadConfig } from './config.js';
import { install } from './installer.js';
import { startWatcher, getAllFeatureStatuses } from './watcher.js';
import type { Integration, FeatureStatus } from './types.js';

export function buildStatusDisplay(features: FeatureStatus[]): string {
  if (features.length === 0) {
    return chalk.yellow('Aucune feature trouvée dans specs/');
  }

  const lines = features.map(f => {
    const stages = [
      f.hasSpec     ? chalk.green('spec ✓')   : chalk.dim('spec ○'),
      f.hasPlan     ? chalk.green('plan ✓')   : chalk.dim('plan ○'),
      f.hasTasks    ? chalk.green('tasks ✓')  : chalk.dim('tasks ○'),
      f.hasImplement? chalk.green('impl ✓')   : chalk.dim('impl ○'),
      f.hasReview   ? chalk.green('review ✓') : chalk.dim('review ○'),
    ];
    return `  ${chalk.cyan(f.id.padEnd(25))} ${stages.join('  ')}`;
  });

  return lines.join('\n');
}

const program = new Command();

program
  .name('sandykit')
  .description('Installateur de commandes spec-driven pour agents IA')
  .version('2.0.0');

program
  .command('init [projet]')
  .description('Initialiser SANDYKIT dans le projet courant')
  .option('--integration <liste>', 'Intégrations : claude,cursor,copilot', 'claude')
  .action(async (projet: string | undefined, opts: { integration: string }) => {
    console.log(
      boxen(
        chalk.bold.cyan('SANDYKIT') + ' v2\n' +
        chalk.dim('Spec-Driven Development pour agents IA'),
        { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
      )
    );

    p.intro(chalk.cyan('Initialisation'));

    const integrations = opts.integration.split(',').map(s => s.trim()) as Integration[];
    const valid: Integration[] = ['claude', 'cursor', 'copilot'];
    const invalid = integrations.filter(i => !valid.includes(i));

    if (invalid.length > 0) {
      p.cancel(`Intégrations invalides : ${invalid.join(', ')}. Valeurs : claude, cursor, copilot`);
      process.exit(1);
    }

    const projectName = projet ?? process.cwd().split(/[/\\]/).pop() ?? 'mon-projet';

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
      integrations.map(i => `${chalk.bold(i)} → ${chalk.dim(agentPaths[i] ?? '')}`).join('\n'),
      'Intégrations installées'
    );

    p.note(
      [
        '/sandykit.specify    Décrire une nouvelle feature',
        '/sandykit.clarify    Affiner une spec floue',
        '/sandykit.plan       Générer le plan technique',
        '/sandykit.tasks      Décomposer en tâches',
        '/sandykit.implement  Implémenter les tâches',
        '/sandykit.review     Réviser le code',
      ].join('\n'),
      'Commandes disponibles dans ton agent IA'
    );

    p.outro(chalk.green(`✓ SANDYKIT prêt dans "${projectName}"`));
  });

program
  .command('watch')
  .description('Surveiller les specs et valider le pipeline')
  .action(() => {
    startWatcher();
  });

program
  .command('status')
  .description("Afficher l'état des features en cours")
  .action(() => {
    const features = getAllFeatureStatuses('specs');
    const cfg = loadConfig();
    if (cfg) console.log(chalk.bold(`\nProjet : ${cfg.projectName}\n`));
    console.log('─'.repeat(70));
    console.log(buildStatusDisplay(features));
    console.log('─'.repeat(70) + '\n');
  });

program
  .command('list')
  .description('Lister toutes les features')
  .action(() => {
    const features = getAllFeatureStatuses('specs');
    if (features.length === 0) {
      console.log(chalk.yellow('Aucune feature trouvée.'));
      return;
    }
    console.log(chalk.bold('\nFeatures :\n'));
    for (const f of features) {
      const done = [f.hasSpec, f.hasPlan, f.hasTasks, f.hasImplement, f.hasReview]
        .filter(Boolean).length;
      console.log(`  ${chalk.cyan(f.id)} — ${done}/5 étapes`);
    }
    console.log();
  });

// Only parse CLI args when run directly (not when imported by tests)
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('cli.cjs'))) {
  program.parse();
}
