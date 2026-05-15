import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { banner } from './ui/display.js';
import { ConfigManager } from './config.js';
import { runChatMode } from './modes/chat.js';
import { runAutoMode } from './modes/auto.js';
import { listSessions, loadSession } from './session/store.js';
import type { LLMProviderName } from './llm/factory.js';
import type { Language } from './llm/types.js';

const program = new Command();

program
  .name('sandykit')
  .description('CLI interactif pour créer des projets logiciels complets via la conversation')
  .version('1.0.0');

async function promptForProviderSetup(cfg: ConfigManager): Promise<void> {
  p.intro(chalk.cyan('Configuration du provider LLM'));

  const provider = await p.select<LLMProviderName>({
    message: 'Quel provider LLM veux-tu utiliser ?',
    options: [
      { value: 'claude', label: 'Claude (Anthropic)', hint: 'Recommandé' },
      { value: 'openai', label: 'ChatGPT (OpenAI)' },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel('Configuration annulée');
    process.exit(0);
  }

  cfg.setProvider(provider as LLMProviderName);

  const keyLabel =
    provider === 'claude'
      ? 'Clé API Anthropic (sk-ant-...) :'
      : 'Clé API OpenAI (sk-...) :';

  const apiKey = await p.password({ message: keyLabel });

  if (p.isCancel(apiKey) || !apiKey) {
    p.cancel('Clé API requise');
    process.exit(1);
  }

  if (provider === 'claude') {
    cfg.setClaudeApiKey(apiKey as string);
  } else {
    cfg.setOpenAIApiKey(apiKey as string);
  }

  const modelDefaults: Record<string, string> = {
    claude: 'claude-sonnet-4-6',
    openai: 'gpt-4o',
  };

  const model = await p.text({
    message: 'Modèle à utiliser (Entrée pour défaut) :',
    placeholder: modelDefaults[provider as string] ?? '',
  });

  if (!p.isCancel(model) && model) {
    cfg.setModel(model as string);
  }

  const lang = await p.select<Language>({
    message: 'Langue des échanges :',
    options: [
      { value: 'fr', label: 'Français' },
      { value: 'en', label: 'English' },
    ],
  });

  if (!p.isCancel(lang)) {
    cfg.setLanguage(lang as Language);
  }

  p.outro(chalk.green('Configuration sauvegardée !'));
}

program
  .command('new')
  .description('Démarrer un nouveau projet')
  .action(async () => {
    banner();
    p.intro(chalk.cyan('Nouveau projet SANDYKIT'));

    const cfg = new ConfigManager();

    if (!cfg.hasApiKey()) {
      await promptForProviderSetup(cfg);
    }

    const mode = await p.select({
      message: 'Quel mode de création ?',
      options: [
        {
          value: 'chat',
          label: 'Mode Chat',
          hint: 'Dialogue guidé, étape par étape',
        },
        {
          value: 'auto',
          label: 'Mode Auto',
          hint: 'Génération rapide en une seule passe',
        },
      ],
    });

    if (p.isCancel(mode)) {
      p.cancel('Annulé');
      process.exit(0);
    }

    if (mode === 'chat') {
      await runChatMode(cfg);
    } else {
      await runAutoMode(cfg);
    }
  });

program
  .command('resume')
  .description('Reprendre un projet en cours')
  .action(async () => {
    banner();
    const sessions = listSessions();
    if (sessions.length === 0) {
      console.log(chalk.yellow('Aucun projet en cours.'));
      return;
    }

    const choice = await p.select({
      message: 'Quel projet reprendre ?',
      options: sessions.map(s => ({
        value: s.id,
        label: s.name,
        hint: `${s.mode} — étape: ${s.currentStage} — ${new Date(s.updatedAt).toLocaleDateString()}`,
      })),
    });

    if (p.isCancel(choice)) {
      p.cancel('Annulé');
      process.exit(0);
    }

    const session = loadSession(choice as string);
    if (!session) {
      console.log(chalk.red('Session introuvable.'));
      return;
    }

    const cfg = new ConfigManager();
    if (!cfg.hasApiKey()) await promptForProviderSetup(cfg);

    if (session.mode === 'chat') {
      await runChatMode(cfg);
    } else {
      await runAutoMode(cfg);
    }
  });

program
  .command('list')
  .description('Lister les projets créés')
  .action(() => {
    const sessions = listSessions();
    if (sessions.length === 0) {
      console.log(chalk.yellow('Aucun projet trouvé.'));
      return;
    }
    console.log(chalk.bold('\nProjets SANDYKIT :\n'));
    for (const s of sessions) {
      console.log(
        chalk.cyan(`  ${s.name}`) +
          chalk.dim(` [${s.mode}] [${s.currentStage}] — ${new Date(s.updatedAt).toLocaleDateString()}`)
      );
    }
    console.log();
  });

program
  .command('config')
  .description('Configurer le provider LLM et la clé API')
  .action(async () => {
    const cfg = new ConfigManager();
    await promptForProviderSetup(cfg);
  });

program.parse();
