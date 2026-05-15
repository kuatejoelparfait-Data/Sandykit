import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export function writeMarkdownDoc(outputDir: string, filename: string, content: string): void {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, filename), content, 'utf-8');
}

export function buildVisionDoc(context: Record<string, string>): string {
  return `# Vision du Projet

## Description
${context['description'] ?? ''}

## Domaine
${context['domain'] ?? ''}

## Utilisateurs cibles
${context['users'] ?? ''}

## Problème résolu
${context['problem'] ?? ''}

## Valeur ajoutée
${context['value'] ?? ''}

---
*Généré par SANDYKIT*
`;
}

export function buildSpecDoc(context: Record<string, string>): string {
  return `# Cahier des Charges

## Vision
${context['vision'] ?? ''}

## Fonctionnalités principales
${context['features'] ?? ''}

## Fonctionnalités secondaires
${context['secondary_features'] ?? ''}

## Contraintes
${context['constraints'] ?? ''}

## Critères de succès
${context['success_criteria'] ?? ''}

---
*Généré par SANDYKIT*
`;
}

export function buildStackDoc(context: Record<string, string>): string {
  return `# Stack Technique

## Stack choisi
${context['stack'] ?? ''}

## Justification
${context['stack_rationale'] ?? ''}

## Dépendances principales
${context['dependencies'] ?? ''}

---
*Généré par SANDYKIT*
`;
}

export function buildArchitectureDoc(context: Record<string, string>): string {
  return `# Architecture

## Vue d'ensemble
${context['architecture'] ?? ''}

## Composants
${context['components'] ?? ''}

## Modèle de données
${context['data_model'] ?? ''}

## Contrats API
${context['api_contracts'] ?? ''}

---
*Généré par SANDYKIT*
`;
}

export function buildTasksDoc(context: Record<string, string>): string {
  return `# Plan de Tâches

## Tâches ordonnées
${context['tasks'] ?? ''}

---
*Généré par SANDYKIT*
`;
}

export function buildScaffoldPlan(context: Record<string, string>): string {
  return `# Plan de Scaffold

## Structure de fichiers
${context['scaffold'] ?? ''}

---
*Généré par SANDYKIT*
`;
}
