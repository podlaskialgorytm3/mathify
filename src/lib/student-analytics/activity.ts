import { ACTIVITY_HEATMAP_DAYS } from "./constants";
import { roundTo } from "./scoring";
import type { ActivityDay, ActivitySummary, AnalyticsSubmission } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Heatmapa kalendarzowa i miary rytmu pracy.
 *
 * Uwaga: to są miary **motywacyjne**, nie oceniające — nie mieszamy ich
 * do średniej wyników i nie robimy z nich kar.
 */
export function buildActivitySummary(
  submissions: AnalyticsSubmission[],
  now: Date = new Date(),
  days: number = ACTIVITY_HEATMAP_DAYS
): ActivitySummary {
  const counts = new Map<string, number>();

  for (const submission of submissions) {
    const key = toDateKey(submission.submittedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const heatmap: ActivityDay[] = [];
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(end.getTime() - offset * DAY_MS);
    const key = toDateKey(date);
    heatmap.push({ date: key, submissions: counts.get(key) ?? 0 });
  }

  const sorted = submissions
    .slice()
    .sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

  return {
    days: heatmap,
    currentStreak: calculateCurrentStreak(submissions),
    longestStreak: calculateLongestStreak(submissions),
    averageDaysBetweenSubmissions: averageDaysBetween(sorted),
    averageReviewWaitHours: averageReviewWait(submissions),
    submissionsLast30Days: submissions.filter(
      (submission) =>
        new Date(submission.submittedAt).getTime() >= now.getTime() - 30 * DAY_MS
    ).length,
  };
}

/** Passa: ile ostatnich prac z rzędu zostało oddanych i sprawdzonych. */
export function calculateCurrentStreak(
  submissions: AnalyticsSubmission[]
): number {
  const sorted = submissions
    .slice()
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

  let streak = 0;

  for (const submission of sorted) {
    if (!submission.reviewed) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function calculateLongestStreak(
  submissions: AnalyticsSubmission[]
): number {
  const sorted = submissions
    .slice()
    .sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

  let longest = 0;
  let current = 0;

  for (const submission of sorted) {
    if (submission.reviewed) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function averageDaysBetween(sorted: AnalyticsSubmission[]): number | null {
  if (sorted.length < 2) {
    return null;
  }

  let total = 0;

  for (let index = 1; index < sorted.length; index++) {
    total +=
      new Date(sorted[index].submittedAt).getTime() -
      new Date(sorted[index - 1].submittedAt).getTime();
  }

  return roundTo(total / (sorted.length - 1) / DAY_MS);
}

function averageReviewWait(
  submissions: AnalyticsSubmission[]
): number | null {
  const reviewed = submissions.filter(
    (submission) => submission.reviewedAt !== null
  );

  if (reviewed.length === 0) {
    return null;
  }

  const total = reviewed.reduce((sum, submission) => {
    const waited =
      new Date(submission.reviewedAt as string).getTime() -
      new Date(submission.submittedAt).getTime();

    return sum + Math.max(0, waited);
  }, 0);

  return roundTo(total / reviewed.length / (60 * 60 * 1000));
}
