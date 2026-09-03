import { WEAK_TASK_THRESHOLD_PERCENT } from "./constants";
import type {
  AnalyticsSubmission,
  AnalyticsTask,
  PointsSummary,
} from "./types";

/** Suma punktów wraz z procentem (zabezpieczona przed dzieleniem przez zero). */
export function summarizePoints(tasks: AnalyticsTask[]): PointsSummary {
  let earned = 0;
  let max = 0;

  for (const task of tasks) {
    earned += task.pointsEarned ?? 0;
    max += task.maxPoints ?? 0;
  }

  return { earned, max, percentage: toPercentage(earned, max) };
}

export function toPercentage(earned: number, max: number): number {
  if (!max || max <= 0) {
    return 0;
  }

  return (earned / max) * 100;
}

export function taskPercentage(task: AnalyticsTask): number {
  return toPercentage(task.pointsEarned, task.maxPoints);
}

export function submissionPercentage(submission: AnalyticsSubmission): number {
  return summarizePoints(submission.tasks).percentage;
}

/**
 * Praca wliczana do diagnozy: sprawdzona przez nauczyciela i mająca rozbicie na zadania.
 * Punkty w `Task` są punktami finalnymi (po ewentualnej korekcie nauczyciela).
 */
export function isGraded(submission: AnalyticsSubmission): boolean {
  return submission.reviewed && submission.tasks.length > 0;
}

export function getGradedSubmissions(
  submissions: AnalyticsSubmission[]
): AnalyticsSubmission[] {
  return submissions
    .filter(isGraded)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );
}

export function isWeakTask(task: AnalyticsTask): boolean {
  return taskPercentage(task) < WEAK_TASK_THRESHOLD_PERCENT;
}

export function isPerfectTask(task: AnalyticsTask): boolean {
  return task.maxPoints > 0 && task.pointsEarned >= task.maxPoints;
}

export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
