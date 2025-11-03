export interface LoadingProgress {
  percentage: number;
  stage: string;
  isComplete: boolean;
  canShow: boolean;
}

export interface QueryState {
  id: string;
  isLoaded: boolean;
  startTime: number;
  timeout: NodeJS.Timeout | null;
}

export interface LoaderConfig {
  disabled?: boolean;
  milestones?: Milestone[];
  messages?: string[];
  minDisplayTime?: number;
  totalTimeout?: number;
  queryTimeout?: number;
}

export interface Milestone {
  at: number;
  label?: string;
  requires?: string[];
}

export interface ProgressStrategies {
  queryProgress: number;
  timeProgress: number;
  milestoneProgress: number;
}
