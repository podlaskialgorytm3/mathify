import { MIN_TASKS_FOR_POSITION } from "./constants";
import { getGradedSubmissions, roundTo, toPercentage } from "./scoring";
import type { AnalyticsSubmission, TaskPositionPerformance } from "./types";

/**
 * Profil „zadanie po zadaniu”: skuteczność wg pozycji zadania w pracy.
 * Ujawnia wzorzec, którego nie widać w średniej pracy: np. opadanie
 * skuteczności na końcowych zadaniach.
 */
export function aggregateByTaskNumber(
  submissions: AnalyticsSubmission[],
  minTasks: number = MIN_TASKS_FOR_POSITION
): TaskPositionPerformance[] {
  const positions = new Map<
    number,
    { earned: number; max: number; taskCount: number }
  >();

  for (const submission of getGradedSubmissions(submissions)) {
    for (const task of submission.tasks) {
      const entry = positions.get(task.taskNumber) ?? {
        earned: 0,
        max: 0,
        taskCount: 0,
      };

      entry.earned += task.pointsEarned ?? 0;
      entry.max += task.maxPoints ?? 0;
      entry.taskCount += 1;

      positions.set(task.taskNumber, entry);
    }
  }

  return Array.from(positions.entries())
    .map(([taskNumber, entry]) => ({
      taskNumber,
      percentage: roundTo(toPercentage(entry.earned, entry.max)),
      taskCount: entry.taskCount,
      enoughData: entry.taskCount >= minTasks,
    }))
    .sort((a, b) => a.taskNumber - b.taskNumber);
}

/**
 * Interpretacja krzywej: czy uczeń traci punkty głównie w końcówce pracy.
 * Porównujemy pierwszą i drugą połowę wiarygodnych pozycji.
 */
export function describeTaskPositionPattern(
  positions: TaskPositionPerformance[]
): { pattern: "declining" | "rising" | "stable" | "unknown"; message: string } {
  const reliable = positions.filter((position) => position.enoughData);

  if (reliable.length < 3) {
    return {
      pattern: "unknown",
      message:
        "Za mało danych, aby ocenić, w której części pracy tracisz najwięcej punktów.",
    };
  }

  const half = Math.floor(reliable.length / 2);
  const firstHalf = reliable.slice(0, half);
  const secondHalf = reliable.slice(reliable.length - half);

  const average = (items: TaskPositionPerformance[]) =>
    items.reduce((sum, item) => sum + item.percentage, 0) / items.length;

  const difference = roundTo(average(secondHalf) - average(firstHalf));

  if (difference <= -10) {
    return {
      pattern: "declining",
      message: `Tracisz punkty głównie w końcówce pracy (${Math.abs(
        difference
      )} p.p. mniej niż na początku). Spróbuj zaczynać od zadań, które wyglądają najtrudniej.`,
    };
  }

  if (difference >= 10) {
    return {
      pattern: "rising",
      message: `Najwięcej punktów tracisz na początku pracy (${difference} p.p. mniej niż w końcówce). Warto poświęcić więcej czasu pierwszym zadaniom.`,
    };
  }

  return {
    pattern: "stable",
    message:
      "Twoja skuteczność jest równomierna niezależnie od pozycji zadania w pracy.",
  };
}
