import * as ui from '../ui/display.js';
import { saveSession, getProjectOutputDir } from '../session/store.js';
import {
  writeMarkdownDoc,
  buildVisionDoc,
  buildSpecDoc,
  buildStackDoc,
  buildArchitectureDoc,
  buildTasksDoc,
  buildScaffoldPlan,
} from '../generators/markdown.js';
import { generateScaffold } from '../generators/scaffold.js';
import type { Session, PipelineStage } from '../session/types.js';
import type { LLMProvider } from '../llm/types.js';

const STAGE_ORDER: PipelineStage[] = ['vision', 'spec', 'stack', 'architect', 'tasks', 'scaffold'];
const TOTAL = STAGE_ORDER.length;

const DOC_BUILDERS: Record<string, (ctx: Record<string, string>) => string> = {
  vision: buildVisionDoc,
  spec: buildSpecDoc,
  stack: buildStackDoc,
  architect: buildArchitectureDoc,
  tasks: buildTasksDoc,
  scaffold: buildScaffoldPlan,
};

const DOC_FILENAMES: Record<string, string> = {
  vision: 'vision.md',
  spec: 'spec.md',
  stack: 'stack.md',
  architect: 'architecture.md',
  tasks: 'tasks.md',
  scaffold: 'scaffold-plan.md',
};

export async function runStage(
  session: Session,
  llm: LLMProvider,
  stageKey: PipelineStage,
  content: string
): Promise<void> {
  const stageNum = STAGE_ORDER.indexOf(stageKey) + 1;
  ui.stage(stageNum, TOTAL, stageKey);

  session.context[stageKey] = content;
  session.completedStages = [...new Set([...session.completedStages, stageKey])];

  const nextIdx = STAGE_ORDER.indexOf(stageKey) + 1;
  if (nextIdx < STAGE_ORDER.length) {
    session.currentStage = STAGE_ORDER[nextIdx]!;
  }

  const outputDir = getProjectOutputDir(session.id);
  const docBuilder = DOC_BUILDERS[stageKey];
  const filename = DOC_FILENAMES[stageKey];

  if (docBuilder && filename) {
    const doc = docBuilder(session.context);
    writeMarkdownDoc(outputDir, filename, doc);
    ui.success(`${filename} généré`);
  }

  if (stageKey === 'scaffold' && session.domain) {
    const created = generateScaffold(session.domain, session.name, outputDir);
    ui.success(`Scaffold généré : ${created.length} fichiers`);
  }

  saveSession(session);
}

export function getNextStage(session: Session): PipelineStage | null {
  const idx = STAGE_ORDER.indexOf(session.currentStage);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1] ?? null;
}

export function isComplete(session: Session): boolean {
  return STAGE_ORDER.every(s => session.completedStages.includes(s));
}
