import { describe, it, expect } from 'vitest';
import {
  buildVisionDoc,
  buildSpecDoc,
  buildStackDoc,
  buildArchitectureDoc,
  buildTasksDoc,
} from '../src/generators/markdown.js';

describe('Markdown generators', () => {
  const ctx = {
    description: 'A great app',
    domain: 'web',
    users: 'developers',
    problem: 'lack of tooling',
    value: 'saves time',
    features: 'feature A, feature B',
    constraints: 'open source',
    success_criteria: 'ships on time',
    stack: 'React + Vite',
    stack_rationale: 'fast and modern',
    dependencies: 'react, vite',
    architecture: 'MVC pattern',
    components: 'Frontend, API',
    data_model: 'User, Project',
    api_contracts: 'GET /projects',
    tasks: '1. Setup, 2. Implement',
  };

  it('buildVisionDoc includes description', () => {
    const doc = buildVisionDoc(ctx);
    expect(doc).toContain('A great app');
    expect(doc).toContain('# Vision du Projet');
  });

  it('buildSpecDoc includes features', () => {
    const doc = buildSpecDoc(ctx);
    expect(doc).toContain('feature A, feature B');
    expect(doc).toContain('# Cahier des Charges');
  });

  it('buildStackDoc includes stack choice', () => {
    const doc = buildStackDoc(ctx);
    expect(doc).toContain('React + Vite');
    expect(doc).toContain('# Stack Technique');
  });

  it('buildArchitectureDoc includes components', () => {
    const doc = buildArchitectureDoc(ctx);
    expect(doc).toContain('Frontend, API');
    expect(doc).toContain('# Architecture');
  });

  it('buildTasksDoc includes tasks', () => {
    const doc = buildTasksDoc(ctx);
    expect(doc).toContain('1. Setup, 2. Implement');
    expect(doc).toContain('# Plan de Tâches');
  });
});
