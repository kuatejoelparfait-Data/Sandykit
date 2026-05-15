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
sandykit init --integration claude
# ou plusieurs agents :
sandykit init --integration claude,cursor,copilot
```

### 2. Utiliser les commandes dans ton agent IA

Ouvre Claude Code, Cursor ou GitHub Copilot dans le projet, puis :

```
/sandykit.specify    Décrire une nouvelle feature
/sandykit.clarify    Affiner une spec floue
/sandykit.plan       Générer le plan technique
/sandykit.tasks      Décomposer en tâches
/sandykit.implement  Implémenter les tâches
/sandykit.review     Réviser le code
```

### 3. Surveiller le pipeline

```bash
sandykit watch    # surveille specs/ et valide l'ordre
sandykit status   # affiche l'état de toutes les features
sandykit list     # liste les features
```

## Structure générée dans ton projet

```
mon-projet/
├── .sandykit/
│   └── config.json
├── .claude/
│   └── commands/          # Claude Code
│       ├── sandykit.specify.md
│       ├── sandykit.clarify.md
│       ├── sandykit.plan.md
│       ├── sandykit.tasks.md
│       ├── sandykit.implement.md
│       └── sandykit.review.md
├── .cursor/
│   └── rules/             # Cursor
├── .github/
│   └── instructions/      # GitHub Copilot
└── specs/
    └── 001-auth-jwt/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        └── review.md
```

## Pipeline spec-driven

```
/sandykit.specify → /sandykit.clarify (optionnel) → /sandykit.plan → /sandykit.tasks → /sandykit.implement → /sandykit.review
```

Le watcher (`sandykit watch`) valide l'ordre et affiche une alerte si tu sautes une étape.

## Tests

```bash
npm test
```

18 tests — config, installer, watcher, CLI.
