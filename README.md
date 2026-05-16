# SANDYKIT v2

Installateur de slash commands spec-driven pour agents IA (Claude Code, Cursor, GitHub Copilot).

## Installation

```bash
git clone https://github.com/kuatejoelparfait-Data/Sandykit.git
cd Sandykit
npm install
npm run build
npm link
```

## Utilisation

### 1. Initialiser dans ton projet

```bash
cd mon-projet
sandykit init
```

L'assistant interactif te propose de choisir ton nom de projet et tes agents IA. Tu peux revenir en arrière avant de confirmer.

### 2. Commandes dans ton agent IA

Ouvre Claude Code, Cursor ou GitHub Copilot dans le projet, puis utilise les slash commands :

| Commande | Rôle |
|---|---|
| `/sandykit.specify` | Décrire une nouvelle feature |
| `/sandykit.clarify` | Affiner une spec floue |
| `/sandykit.plan` | Générer le plan technique |
| `/sandykit.tasks` | Décomposer en tâches |
| `/sandykit.implement` | Implémenter les tâches |
| `/sandykit.review` | Réviser le code produit |
| `/sandykit.back` | Revenir à l'étape précédente |

### 3. Commandes terminal

#### Suivi du pipeline

```bash
sandykit watch    # surveille specs/ en temps réel et valide l'ordre
sandykit status   # affiche l'état de toutes les features
sandykit list     # liste les features avec barre de progression
```

#### Gestion des features

```bash
sandykit new [nom]      # créer une feature directement depuis le terminal
sandykit reset [nom]    # supprimer une étape ou toute une feature
sandykit export [nom]   # copier les fichiers d'une feature dans exports/
sandykit open [nom]     # ouvrir le dossier d'une feature dans l'explorateur
sandykit rename [nom]   # renommer une feature
sandykit archive [nom]  # archiver une feature terminée dans archives/
```

#### Maintenance

```bash
sandykit update   # réinstaller les commandes agent après une mise à jour
sandykit doctor   # vérifier la configuration et les fichiers installés
```

## Pipeline spec-driven

```
specify → clarify (optionnel) → plan → tasks → implement → review
```

Chaque étape génère un fichier dans `specs/NNN-nom-feature/`. Le watcher valide l'ordre et alerte si une étape est sautée. `/sandykit.back` permet de revenir en arrière sans perdre le travail.

## Structure générée dans ton projet

```
mon-projet/
├── .sandykit/
│   └── config.json
├── .claude/
│   └── commands/              # Claude Code
│       ├── sandykit.specify.md
│       ├── sandykit.clarify.md
│       ├── sandykit.plan.md
│       ├── sandykit.tasks.md
│       ├── sandykit.implement.md
│       ├── sandykit.review.md
│       └── sandykit.back.md
├── .cursor/
│   └── rules/                 # Cursor
├── .github/
│   └── instructions/          # GitHub Copilot
├── specs/
│   └── 001-auth-jwt/
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       ├── implement.md
│       └── review.md
└── exports/                   # généré par sandykit export
    └── 001-auth-jwt/
```

## Tests

```bash
npm test
```

18 tests — config, installer, watcher, CLI.
