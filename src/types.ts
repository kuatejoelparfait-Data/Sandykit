export type Integration = 'claude' | 'cursor' | 'copilot';

export interface SandykitConfig {
  projectName: string;
  integrations: Integration[];
  createdAt: string;
}

export interface FeatureStatus {
  id: string;
  name: string;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  hasImplement: boolean;
  hasReview: boolean;
}
