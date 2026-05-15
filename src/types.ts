export type ProjectDomain = 'web' | 'api' | 'data' | 'mobile' | 'cli-tool';
export type PipelineStage = 'vision' | 'spec' | 'stack' | 'architect' | 'tasks' | 'scaffold';
export type SessionMode = 'chat' | 'auto';

export interface Session {
  id: string;
  name: string;
  domain: ProjectDomain | null;
  mode: SessionMode;
  currentStage: PipelineStage;
  completedStages: PipelineStage[];
  context: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
