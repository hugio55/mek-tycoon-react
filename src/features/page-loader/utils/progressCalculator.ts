import { PROGRESS_WEIGHTS } from '../config/constants';
import type { ProgressStrategies } from '../types';

export function calculateQueryProgress(loadedCount: number, totalCount: number): number {
  if (totalCount === 0) return 100;
  return (loadedCount / totalCount) * 100;
}

export function calculateTimeBasedProgress(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  const asymptotic = 90 * (1 - Math.exp(-seconds / 3));
  return Math.min(asymptotic, 90);
}

export function calculateMilestoneProgress(
  walletLoaded: boolean,
  criticalDataLoaded: boolean,
  pageDataLoaded: boolean
): number {
  let progress = 0;

  if (walletLoaded) progress += 25;
  if (criticalDataLoaded) progress += 25;
  if (pageDataLoaded) progress += 40;

  return progress;
}

export function combineStrategies(strategies: ProgressStrategies): number {
  const { queryProgress, timeProgress, milestoneProgress } = strategies;
  const { QUERY_DETECTION, COMMON_MILESTONES, TIME_BASED } = PROGRESS_WEIGHTS;

  const combined =
    queryProgress * QUERY_DETECTION +
    milestoneProgress * COMMON_MILESTONES +
    timeProgress * TIME_BASED;

  return Math.max(queryProgress, timeProgress, milestoneProgress, combined);
}

export function snapToMilestone(progress: number): number {
  if (progress < 25) return 0;
  if (progress < 50) return 25;
  if (progress < 75) return 50;
  if (progress < 90) return 75;
  if (progress < 100) return 90;
  return 100;
}

export function getStageMessage(progress: number, customMessages?: string[]): string {
  const messages = customMessages || [
    'INITIALIZING SYSTEMS...',
    'LOADING DATA...',
    'PREPARING INTERFACE...',
    'ALMOST READY...',
  ];

  if (progress < 25) return messages[0];
  if (progress < 50) return messages[1] || messages[0];
  if (progress < 75) return messages[2] || messages[1] || messages[0];
  if (progress < 100) return messages[3] || messages[2] || messages[0];
  return 'READY';
}
