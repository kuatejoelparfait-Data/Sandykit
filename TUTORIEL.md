# Tutoriel débutant — SANDYKIT

> **Pour qui ?** Ce tutoriel s'adresse à quelqu'un qui n'a jamais utilisé SANDYKIT.  
> **Durée estimée :** 30 à 60 minutes pour ton premier projet complet.  
> **Ce que tu vas apprendre :** Installer SANDYKIT, décrire ton projet, et obtenir un code fonctionnel généré par une IA.

---

## Avant de commencer

### Ce dont tu as besoin

Vérifie que tu as ces outils installés sur ton ordinateur :

| Outil | Comment vérifier | Installer si absent |
|-------|-----------------|---------------------|
| **Node.js** (v18+) | `node --version` | https://nodejs.org |
| **npm** (v9+) | `npm --version` | Inclus avec Node.js |
| **Git** | `git --version` | https://git-scm.com |
| **Claude Code** | `claude --version` | https://claude.ai/download |

Tu as aussi besoin d'**une clé API** pour l'IA :
- **Claude (recommandé)** → https://console.anthropic.com → API Keys → Create Key
- **OpenAI (alternative)** → https://platform.openai.com → API Keys → Create
- **Ollama (gratuit, local)** → https://ollama.com → aucune clé requise

---

## Partie 1 — Installer SANDYKIT

> ⏱ Durée : 5 minutes

### 1.1 Télécharger SANDYKIT

Ouvre un terminal et tape ces commandes une par une :

```bash
git clone https://github.com/kuatejoelparfait-Data/Sandykit.git
```

```bash
cd Sandykit
```

```bash
npm install
```

```bash
npm run build
```

```bash
npm link
```

### 1.2 Vérifier que ça fonctionne

```bash
sandykit --version
```

Tu dois voir : `2.0.0`

```bash
sandykit --help
```

Tu dois voir la liste des commandes disponibles. Si c'est le cas, **SANDYKIT est installé correctement** ✅

---

## Partie 2 — Créer ton premier projet

> ⏱ Durée : 5 minutes

### 2.1 Créer un dossier pour ton projet

Dans le terminal, navigue vers l'endroit où tu veux créer ton projet (par exemple le bureau) :

```bash
cd ~/Desktop
```

Crée un nouveau dossier :

```bash
mkdir mon-premier-projet
cd mon-premier-projet
```

Initialise Git (pour pouvoir sauvegarder l'historique) :

```bash
git init
git config user.name "Ton Nom"
git config user.email "ton@email.com"
```

### 2.2 Initialiser SANDYKIT dans ce projet

```bash
sandykit init
```

Un menu interactif s'affiche. Voici comment le remplir :

**Question 1 : Nom du projet**
```
◆  Nom du projet ?
│  mon-premier-projet          ← tape le nom et appuie sur Entrée
```

**Question 2 : Agent IA à intégrer**
```
◆  Agent(s) IA à intégrer ?
│  ◉ Claude Code               ← appuie sur Espace pour sélectionner
│  ○ Cursor
│  ○ GitHub Copilot
                               ← appuie sur Entrée pour confirmer
```

**Question 3 : Confirmation**
```
◆  Confirmer l'installation ?
│  ● Oui                       ← appuie sur Entrée
```

Tu verras :
```
✓ SANDYKIT installé dans mon-premier-projet
  Agent : Claude Code → .claude/commands/ (7 fichiers)
```

**Félicitations, SANDYKIT est configuré dans ton projet !** 🎉

---

## Partie 3 — Choisir comment travailler

SANDYKIT offre deux façons de travailler. Lis les deux, puis choisis celle qui te convient.

---

### 🅰 Mode Autonome (recommandé pour débuter)

**C'est quoi ?** Tu décris ton projet en quelques phrases. SANDYKIT génère automatiquement la spec, le plan, les tâches ET le code. Tu valides à chaque étape.

**Avantage :** Rapide, tout est automatisé.  
**Idéal pour :** Avoir un premier projet fonctionnel rapidement.

→ **Continue avec la Partie 4**

---

### 🅱 Mode Manuel avec ton agent IA

**C'est quoi ?** Tu travailles directement dans Claude Code avec des commandes slash (`/sandykit.specify`, `/sandykit.plan`, etc.). L'IA t'assiste à chaque étape mais tu diriges.

**Avantage :** Plus de contrôle, meilleure compréhension du processus.  
**Idéal pour :** Apprendre le développement spec-driven.

→ **Continue avec la Partie 5**

---

## Partie 4 — Mode Autonome (sandykit dev)

> ⏱ Durée : 20 à 40 minutes selon la taille du projet

### 4.1 Préparer la description de ton projet

Avant de lancer SANDYKIT, prépare une description de ce que tu veux créer.

**Exemple de bonne description :**
```
Je veux une API REST pour une application de gestion de tâches.

Les utilisateurs peuvent :
- Créer un compte et se connecter
- Créer des projets
- Ajouter des tâches dans chaque projet (titre, description, statut, date d'échéance)
- Marquer des tâches comme terminées
- Voir toutes leurs tâches avec des filtres (par statut, par date)

Contraintes techniques :
- Node.js avec TypeScript
- Base de données PostgreSQL
- Authentification par JWT
- Documentation API automatique (Swagger)
```

> 💡 **Astuce :** Plus ta description est précise, meilleur sera le résultat. Réponds mentalement à ces questions :
> - Qui utilise l'application ?
> - Que peuvent-ils faire ?
> - Quelles sont les contraintes techniques ?

Tu peux aussi écrire ça dans un fichier texte :

```bash
# Crée un fichier cahier-des-charges.md
```

Puis ouvre-le dans ton éditeur et écris ta description dedans.

### 4.2 Lancer le pipeline

```bash
sandykit dev
```

Ou si tu as un fichier :

```bash
sandykit dev --file cahier-des-charges.md
```

### 4.3 Suivre les étapes

#### Étape ① — Choisir le provider IA

```
◆  Quel provider IA ?
│  ● Claude (Anthropic)     ← recommandé
│  ○ OpenAI (GPT-4o...)
│  ○ Ollama (local)
│  ○ Provider personnalisé
```

Appuie sur les flèches ↑↓ pour naviguer, **Entrée** pour valider.

#### Étape ② — Entrer ta clé API

```
◆  Clé API Anthropic :
│  ••••••••••••••••••    ← la clé est masquée pour la sécurité
```

Colle ta clé API. Elle sera sauvegardée dans le keychain sécurisé de ton OS — **tu n'auras plus à la taper la prochaine fois**.

#### Étape ③ — Choisir le modèle

```
◆  Modèle :
│  ● claude-sonnet-4-6    ← bon équilibre qualité/coût
│  ○ claude-opus-4-7       ← plus puissant, plus cher
│  ○ claude-haiku-4-5      ← plus rapide, moins cher
```

Pour commencer, choisis `claude-sonnet-4-6`.

#### Étape ④ — Nom du projet et type

```
◆  Nom du projet ?
│  gestion-taches

◆  Type de projet :
│  ○ SaaS Web App
│  ● API REST             ← pour notre exemple
│  ○ App Mobile
│  ○ Outil CLI
│  ○ Pipeline Data / IA
│  ○ Fullstack Monorepo
│  ○ Projet personnalisé
```

#### Étape ⑤ — Description du projet

```
◆  Source du cahier des charges :
│  ○ Fichier existant
│  ● Saisir maintenant    ← si tu n'as pas de fichier
│  ○ Coller du texte
```

Tape ou colle ta description.

#### Étape ⑥ — La spec se génère 🤖

Tu vas voir l'IA écrire la spec en temps réel :

```
  Génération de la spec...

  # Spécification fonctionnelle — Gestion de Tâches

  ## 1. Vue d'ensemble
  Application REST API permettant la gestion de tâches organisées
  en projets, avec authentification JWT et rôles utilisateurs.

  ## 2. Utilisateurs et rôles
  - **Utilisateur standard** : créer/modifier ses propres tâches
  - **Admin** : accès à tous les projets

  ## 3. Fonctionnalités
  ### 3.1 Authentification
  - POST /auth/register — créer un compte
  - POST /auth/login — se connecter, reçoit un JWT
  ...
```

Quand la spec est terminée, tu as le choix :

```
◆  Spec — que faire ?
│  ● ✓  Valider et continuer       ← si la spec te convient
│  ○ ↺  Régénérer                  ← si tu veux des modifications
│  ○ ✏  Modifier manuellement      ← pour éditer à la main
│  ○ ←  Étape précédente           ← pour changer la description
│  ○ ✗  Annuler
```

> 💡 **Conseil :** Lis la spec avant de valider. Si quelque chose ne correspond pas à ton idée, choisis `↺ Régénérer` et précise ce que tu veux changer.

**Si tu régénères :**
```
◆  Qu'est-ce qui ne va pas / que veux-tu modifier ?
│  Il manque la gestion des priorités pour les tâches (basse/moyenne/haute)
```

#### Étape ⑦ — Le plan se génère

Même processus : l'IA génère le plan technique, tu valides.

```
  # Plan technique — Gestion de Tâches

  ## Stack
  - Runtime : Node.js 20 + TypeScript
  - Framework : Fastify
  - ORM : Prisma
  - Base de données : PostgreSQL
  - Auth : JWT (jsonwebtoken)
  - Validation : Zod
  - Documentation : Swagger (fastify-swagger)
  - Tests : Vitest

  ## Structure des dossiers
  src/
  ├── routes/
  │   ├── auth.ts
  │   ├── projects.ts
  │   └── tasks.ts
  ├── models/
  ├── middlewares/
  └── plugins/
  ...
```

#### Étape ⑧ — Les tâches se génèrent

```
  # Tâches — Gestion de Tâches

  ## Backend
  - [ ] Initialiser le projet Fastify + TypeScript
  - [ ] Configurer Prisma + schéma PostgreSQL
  - [ ] Implémenter POST /auth/register
  - [ ] Implémenter POST /auth/login
  - [ ] Middleware d'authentification JWT
  - [ ] CRUD Projets
  - [ ] CRUD Tâches avec filtres
  - [ ] Documentation Swagger
  - [ ] Tests d'intégration
```

#### Étape ⑨ — Estimation du coût

Avant de générer le code, SANDYKIT t'affiche le coût estimé :

```
  Estimation de coût :

  Modèle : claude-sonnet-4-6
  Coût estimé : $0.142

  Détail par étape :
    implement    ~9 200 tokens   $0.098
    tests        ~4 500 tokens   $0.044
```

> 💡 Pour un projet simple, compte entre **$0.05 et $0.30** avec claude-sonnet-4-6.

#### Étape ⑩ — Le code se génère 💻

C'est la partie la plus longue (2 à 5 minutes). SANDYKIT génère tous les fichiers :

```
  ## Fichier: package.json
  {
    "name": "gestion-taches",
    "version": "1.0.0",
    ...
  }

  ## Fichier: src/app.ts
  import Fastify from 'fastify'
  ...

  ## Fichier: src/routes/auth.ts
  import { FastifyPluginAsync } from 'fastify'
  ...

  ## Fichier: prisma/schema.prisma
  model User {
    id        String   @id @default(cuid())
    email     String   @unique
    ...
  }
```

> ⚠️ **Ne ferme pas le terminal** pendant la génération.

#### Étape ⑪ — Tests et validation

```
◆  Générer les tests automatiquement ?
│  ● Oui
```

```
  ✓ 12 fichier(s) de test générés
  ✓ Prettier (auto-configuré)
  ✓ TypeScript — 0 erreur
  ✓ README.md — présent
  ✓ .env.example — présent
```

#### Résultat final

```
✓ Projet "gestion-taches" livré — specs dans ./specs/001-gestion-taches
```

### 4.4 Vérifier le résultat

Regarde ce qui a été créé dans ton dossier :

```bash
ls -la
```

Tu devrais voir quelque chose comme :

```
mon-premier-projet/
├── package.json          ← dépendances npm
├── tsconfig.json         ← config TypeScript
├── .env.example          ← variables d'environnement à configurer
├── README.md             ← documentation du projet généré
├── .gitignore
├── prisma/
│   └── schema.prisma     ← schéma base de données
├── src/
│   ├── app.ts
│   ├── routes/
│   ├── middlewares/
│   └── ...
├── tests/
└── specs/
    └── 001-gestion-taches/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

### 4.5 Lancer le projet généré

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Édite .env et remplis les variables (URL base de données, secret JWT...)
# Exemple : DATABASE_URL="postgresql://user:password@localhost:5432/gestion_taches"

# Lancer les migrations
npx prisma migrate dev

# Démarrer le projet
npm run dev
```

---

## Partie 5 — Mode Manuel avec Claude Code

> ⏱ Durée : 30 à 90 minutes selon ta feature

### 5.1 Ouvrir Claude Code dans ton projet

```bash
claude .
```

Claude Code s'ouvre dans le terminal, dans le contexte de ton projet.

### 5.2 Créer ta première feature avec /sandykit.specify

Dans Claude Code, tape :

```
/sandykit.specify
```

Claude va te demander de décrire la feature. Réponds en langage naturel :

```
Je veux créer un système d'authentification avec :
- Inscription par email + mot de passe
- Connexion avec token JWT
- Route protégée /me qui retourne le profil utilisateur
- Validation des emails
- Hachage des mots de passe avec bcrypt
```

Claude génère la spec et la sauvegarde dans `specs/001-auth/spec.md`.

### 5.3 Affiner avec /sandykit.clarify (si besoin)

Si la spec est floue ou incomplète :

```
/sandykit.clarify
```

```
La spec ne mentionne pas la durée de validité des tokens JWT.
Les tokens doivent expirer après 7 jours.
```

### 5.4 Générer le plan avec /sandykit.plan

```
/sandykit.plan
```

Claude génère le plan technique basé sur ta spec : `specs/001-auth/plan.md`

### 5.5 Décomposer en tâches avec /sandykit.tasks

```
/sandykit.tasks
```

Claude crée une liste de tâches ordonnées : `specs/001-auth/tasks.md`

### 5.6 Implémenter avec /sandykit.implement

```
/sandykit.implement
```

Claude implémente les tâches une par une. Il crée les fichiers dans ton projet.

### 5.7 Réviser avec /sandykit.review

```
/sandykit.review
```

Claude analyse le code produit et donne des recommandations.

### 5.8 Revenir en arrière si besoin

À **n'importe quelle étape**, si tu n'es pas satisfait :

```
/sandykit.back
```

Tu reviens à l'étape précédente sans perdre ton travail.

---

## Partie 6 — Suivre l'avancement de ton projet

Ouvre un **nouveau terminal** (garde le premier ouvert avec Claude Code) :

```bash
# Voir l'état de toutes tes features
sandykit status
```

```
  Projet : mon-premier-projet
  Agent  : Claude Code

  Features (2) :

  ✓ spec  ✓ plan  ✓ tasks  ✓ impl  ✓ review   001-auth
  ✓ spec  ✓ plan  ○ tasks  ○ impl  ○ review   002-gestion-projets
```

```bash
# Surveiller en temps réel (se met à jour automatiquement)
sandykit watch
```

```bash
# Liste détaillée avec barre de progression
sandykit list
```

---

## Partie 7 — Gérer tes features au fil du temps

```bash
# Créer une nouvelle feature depuis le terminal
sandykit new dashboard

# Réinitialiser une étape (si tu veux recommencer)
sandykit reset 001-auth

# Archiver une feature terminée
sandykit archive 001-auth

# Ouvrir le dossier d'une feature dans l'explorateur
sandykit open 001-auth

# Exporter les fichiers d'une feature
sandykit export 001-auth
```

---

## Partie 8 — Partager ton travail

### Partager une spec avec un collègue

```bash
sandykit share mon-premier-projet --all
```

```
  🔗 Lien de partage :
     https://gist.github.com/a1b2c3d4e5f6

  Le gist est secret (seules les personnes avec le lien y ont accès)
```

Envoie ce lien à ton collègue. Il peut lire ta spec, ton plan et tes tâches sans avoir accès à ton code.

> Pour créer des gists authentifiés (modifiables), crée un token sur :  
> https://github.com/settings/tokens/new?scopes=gist  
> Puis : `GITHUB_TOKEN=ton-token sandykit share mon-projet`

---

## Résumé — Les commandes essentielles

| Ce que tu veux faire | Commande |
|----------------------|----------|
| Installer SANDYKIT dans un projet | `sandykit init` |
| Générer un projet complet automatiquement | `sandykit dev` |
| Reprendre un projet interrompu | `sandykit dev --resume` |
| Voir l'état du projet | `sandykit status` |
| Surveiller en temps réel | `sandykit watch` |
| Créer une nouvelle feature | `sandykit new nom-feature` |
| Archiver une feature terminée | `sandykit archive nom-feature` |
| Partager une spec | `sandykit share nom-projet` |
| Vérifier la configuration | `sandykit doctor` |

**Dans Claude Code (slash commands) :**

| Ce que tu veux faire | Commande |
|----------------------|----------|
| Décrire une feature | `/sandykit.specify` |
| Affiner une spec | `/sandykit.clarify` |
| Générer le plan | `/sandykit.plan` |
| Décomposer en tâches | `/sandykit.tasks` |
| Implémenter | `/sandykit.implement` |
| Réviser le code | `/sandykit.review` |
| Revenir en arrière | `/sandykit.back` |

---

## En cas de problème

### "sandykit: command not found"
```bash
# Relancer le link
cd ~/Desktop/Sandykit
npm link
```

### "API key invalid"
- Vérifie que tu as bien copié toute la clé (sans espace au début/fin)
- Vérifie que la clé a les permissions nécessaires sur la console du provider

### Le pipeline s'est arrêté en cours de route
```bash
# Reprendre là où tu t'es arrêté
sandykit dev --resume
```

### Le code généré ne compile pas
- Lis les erreurs TypeScript : `npx tsc --noEmit`
- Souvent c'est une variable d'environnement manquante → vérifie ton `.env`

### Vérifier que tout est bien configuré
```bash
sandykit doctor
```

---

## Prochaines étapes

Une fois à l'aise avec les bases :

- 📖 Lis le `README.md` pour les fonctionnalités avancées
- 👥 Invite un collègue avec `sandykit team init`
- 🎫 Exporte tes tâches vers Jira/Linear avec `sandykit tickets`
- 🔄 Active les git auto-commits dans `sandykit.team.json`

---

*Bonne chance avec ton premier projet ! 🚀*
