export interface ProjectTemplate {
  id: string;
  label: string;
  hint: string;
  stackHint: string;
  specPromptBoost: string;
  planPromptBoost: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'saas-web',
    label: 'SaaS Web App',
    hint: 'Next.js + Auth + Stripe + DB',
    stackHint: 'Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, Stripe',
    specPromptBoost: 'Inclure : gestion des plans/abonnements, onboarding utilisateur, dashboard, rôles admin/user.',
    planPromptBoost: 'Architecture SaaS : multi-tenant, rate limiting, webhooks Stripe, emails transactionnels (Resend), middleware auth.',
  },
  {
    id: 'api-rest',
    label: 'API REST',
    hint: 'Node.js/Express ou Fastify + OpenAPI',
    stackHint: 'Node.js, TypeScript, Fastify, Prisma, PostgreSQL, Zod, JWT, Swagger/OpenAPI',
    specPromptBoost: 'Inclure : endpoints CRUD, authentification JWT, pagination, filtres, gestion des erreurs standardisée (RFC 7807).',
    planPromptBoost: 'Architecture API : versioning (/api/v1), middleware chain, validation Zod, documentation OpenAPI auto-générée, tests d\'intégration.',
  },
  {
    id: 'cli-tool',
    label: 'Outil CLI',
    hint: 'Node.js + Commander + distribution npm',
    stackHint: 'Node.js, TypeScript, Commander.js, @clack/prompts, chalk, esbuild, vitest',
    specPromptBoost: 'Inclure : commandes principales, options/flags, fichier de config utilisateur, messages d\'aide clairs.',
    planPromptBoost: 'Architecture CLI : entry point unique, sous-commandes, config via ~/.config ou .rc, publication npm avec bin field.',
  },
  {
    id: 'mobile-rn',
    label: 'App Mobile',
    hint: 'React Native + Expo + navigation',
    stackHint: 'React Native, Expo SDK 51, TypeScript, Expo Router, Zustand, React Query, NativeWind',
    specPromptBoost: 'Inclure : navigation (tabs + stack), gestion offline, notifications push, stockage local sécurisé.',
    planPromptBoost: 'Architecture mobile : Expo Router pour la navigation, Zustand pour le state, React Query pour les données, AsyncStorage chiffré.',
  },
  {
    id: 'data-pipeline',
    label: 'Pipeline Data / IA',
    hint: 'Python + FastAPI + ML + PostgreSQL',
    stackHint: 'Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, Celery, Redis, pandas, scikit-learn ou PyTorch',
    specPromptBoost: 'Inclure : ingestion de données, transformations, entraînement/inférence de modèle, API d\'exposition, monitoring.',
    planPromptBoost: 'Architecture data : worker Celery pour tâches asynchrones, stockage S3/local, modèle versionné (MLflow), API FastAPI avec OpenAPI.',
  },
  {
    id: 'fullstack-monorepo',
    label: 'Fullstack Monorepo',
    hint: 'Turborepo + apps + packages partagés',
    stackHint: 'Turborepo, Next.js (web), React Native (mobile), shared UI package, TypeScript, tRPC, Prisma',
    specPromptBoost: 'Inclure : apps web et mobile partageant le même backend, composants UI partagés, types partagés.',
    planPromptBoost: 'Structure monorepo Turborepo : apps/web, apps/mobile, packages/ui, packages/db, packages/config. tRPC pour type-safety end-to-end.',
  },
  {
    id: 'custom',
    label: 'Projet personnalisé',
    hint: 'L\'IA choisit la stack selon la description',
    stackHint: '',
    specPromptBoost: '',
    planPromptBoost: '',
  },
];

export function getTemplate(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(t => t.id === id);
}
