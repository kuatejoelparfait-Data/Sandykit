---
description: Implémenter toutes les tâches du plan une par une en suivant le TDD.
handoffs:
  - label: Réviser le code
    agent: sandykit.review
    prompt: Révise l'implémentation
---

## Entrée utilisateur

$ARGUMENTS

(filtre optionnel : numéro de tâche ou mot-clé)

## Étapes

1. **Lis les tâches** : `specs/NNN-nom/tasks.md`
2. **Lis le plan** : `specs/NNN-nom/plan.md`
3. **Lis la spec** : `specs/NNN-nom/spec.md`

4. **Pour chaque tâche** (dans l'ordre) :

   a. Annonce : `## Tâche N : [Titre]`

   b. **Écris le test d'abord** (TDD) :
      - Test qui échoue pour le comportement attendu
      - Lance les tests → vérifie qu'ils échouent

   c. **Implémente le code minimal** :
      - Juste ce qu'il faut pour faire passer les tests
      - Respecte les patterns existants du projet

   d. **Lance les tests** → vérifie qu'ils passent

   e. **Commit** :
      ```
      git add [fichiers]
      git commit -m "feat: [description courte]"
      ```

   f. Coche la tâche dans `tasks.md` : `- [x]`

5. **Rapport final** :
   - Liste des tâches complétées
   - Tests passants
   - Fichiers créés/modifiés

## Règles

- Une tâche à la fois, toujours dans l'ordre
- Ne jamais skipper les tests
- Commit après chaque tâche
- Si bloqué sur une tâche : documente le blocage et passe à la suivante
