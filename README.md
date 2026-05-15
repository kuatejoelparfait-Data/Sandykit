# SANDYKIT

CLI interactif TypeScript/Node.js qui guide un développeur à travers la création complète d'un projet logiciel via des échanges conversationnels. Intègre Claude (Anthropic) et ChatGPT (OpenAI).

## Installation depuis GitHub

```bash
git clone <url-du-repo>
cd SANDYKIT
npm install
npm run build
npm link
```

Après `npm link`, la commande `sandykit` est disponible globalement.

## Premier démarrage

```bash
sandykit new
```

Au premier lancement (ou si aucune clé API n'est configurée), SANDYKIT te demandera :

1. **Provider LLM** : Claude (Anthropic) ou ChatGPT (OpenAI)
2. **Clé API** : entrée masquée dans le terminal
3. **Modèle** : ex. `claude-sonnet-4-6` ou `gpt-4o` (Entrée = défaut)
4. **Langue** : Français ou English

Ensuite tu choisis le **mode** :
- **Chat** — dialogue guidé étape par étape (recommandé pour projets complexes)
- **Auto** — génération rapide en une seule passe

## Commandes disponibles

```bash
sandykit new        # Démarrer un nouveau projet
sandykit resume     # Reprendre un projet en cours
sandykit list       # Lister tous les projets créés
sandykit config     # Reconfigurer le provider / clé API
```

## Variables d'environnement (optionnel)

Au lieu d'entrer la clé dans la CLI, tu peux la définir en env :

```bash
# Pour Claude
export SANDYKIT_CLAUDE_KEY=sk-ant-...

# Pour OpenAI
export SANDYKIT_OPENAI_KEY=sk-...
```

## Pipeline de création

SANDYKIT guide à travers 6 étapes :

| Étape | Livrable |
|-------|---------|
| `/vision` | `vision.md` — description, utilisateurs, problème |
| `/spec` | `spec.md` — cahier des charges complet |
| `/stack` | `stack.md` — stack technique justifié |
| `/architect` | `architecture.md` — composants, data model, API |
| `/tasks` | `tasks.md` — plan de tâches ordonné |
| `/scaffold` | Structure de fichiers + boilerplate |

## Domaines supportés

- **Web** — React + Vite + TypeScript
- **API REST** — Express + TypeScript
- **Data / ML** — Python + Jupyter + pandas
- **Mobile** — React Native + Expo
- **CLI Tool** — Node.js + commander + esbuild

## Fichiers générés

Tous les fichiers sont sauvegardés dans `~/.sandykit/projects/<project-id>/` :

```
~/.sandykit/projects/mon-projet/
├── session.json        # État de la session (resumable)
├── vision.md
├── spec.md
├── stack.md
├── architecture.md
├── tasks.md
└── scaffold/           # Code boilerplate du projet
    └── ...
```

## Tests

```bash
npm test
```

## Tech Stack de SANDYKIT

| Composant | Choix |
|-----------|-------|
| Language | TypeScript 5 |
| Runtime | tsx (dev) + esbuild (build) |
| CLI framework | commander.js |
| Prompts | @clack/prompts |
| Affichage | chalk + boxen |
| LLM | @anthropic-ai/sdk + openai |
| Tests | vitest |
