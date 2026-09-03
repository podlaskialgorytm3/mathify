import { buildActivitySummary } from "./activity";
import {
  getGradedSubmissions,
  isPerfectTask,
  isWeakTask,
  roundTo,
  submissionPercentage,
  summarizePoints,
} from "./scoring";
import { buildTrend } from "./trend";
import type { AnalyticsSubmission, TrendPoint, TrendSummary } from "./types";

export interface StatisticsOverview {
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  totalPointsEarned: number;
  totalPointsMax: number;
  averagePercentage: number;
  bestPercentage: number;
  worstPercentage: number;
  totalTasks: number;
  perfectTasks: number;
  weakTasks: number;
  currentStreak: number;
  trend: TrendSummary;
  trendPoints: TrendPoint[];
}

/** Zestaw KPI + trend: fundament panelu, liczony po stronie serwera. */
export function buildOverview(
  submissions: AnalyticsSubmission[],
  now: Date = new Date()
): StatisticsOverview {
  const graded = getGradedSubmissions(submissions);
  const allTasks = graded.flatMap((submission) => submission.tasks);
  const points = summarizePoints(allTasks);

  const percentages = graded.map((submission) =>
    submissionPercentage(submission)
  );

  const { points: trendPoints, summary: trend } = buildTrend(submissions);
  const activity = buildActivitySummary(submissions, now);

  return {
    totalSubmissions: submissions.length,
    gradedSubmissions: graded.length,
    pendingSubmissions: submissions.filter((submission) => !submission.reviewed)
      .length,
    totalPointsEarned: roundTo(points.earned, 2),
    totalPointsMax: roundTo(points.max, 2),
    averagePercentage: roundTo(points.percentage),
    bestPercentage: percentages.length > 0 ? roundTo(Math.max(...percentages)) : 0,
    worstPercentage:
      percentages.length > 0 ? roundTo(Math.min(...percentages)) : 0,
    totalTasks: allTasks.length,
    perfectTasks: allTasks.filter(isPerfectTask).length,
    weakTasks: allTasks.filter(isWeakTask).length,
    currentStreak: activity.currentStreak,
    trend,
    trendPoints,
  };
}
