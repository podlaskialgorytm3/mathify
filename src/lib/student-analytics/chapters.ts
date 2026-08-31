import { MIN_TASKS_FOR_CHAPTER } from "./constants";
import { getGradedSubmissions, roundTo, toPercentage } from "./scoring";
import type { AnalyticsSubmission, ChapterPerformance } from "./types";

interface Accumulator {
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  courseId: string;
  courseTitle: string;
  earned: number;
  max: number;
  taskCount: number;
  submissionIds: Set<string>;
  subchapters: Map<
    string,
    { title: string; earned: number; max: number; taskCount: number }
  >;
}

/**
 * Mapa mocnych i słabych stron — agregacja per rozdział, a nie per praca.
 * Rozdział jest „wystarczająco dobrą" jednostką tematyczną i nie wymaga
 * ręcznego tagowania zadań przez nauczyciela.
 */
export function aggregateByChapter(
  submissions: AnalyticsSubmission[],
  minTasks: number = MIN_TASKS_FOR_CHAPTER
): ChapterPerformance[] {
  const chapters = new Map<string, Accumulator>();

  for (const submission of getGradedSubmissions(submissions)) {
    const entry: Accumulator = chapters.get(submission.chapterId) ?? {
      chapterId: submission.chapterId,
      chapterTitle: submission.chapterTitle,
      chapterOrder: submission.chapterOrder,
      courseId: submission.courseId,
      courseTitle: submission.courseTitle,
      earned: 0,
      max: 0,
      taskCount: 0,
      submissionIds: new Set<string>(),
      subchapters: new Map(),
    };

    const subchapter = entry.subchapters.get(submission.subchapterId) ?? {
      title: submission.subchapterTitle,
      earned: 0,
      max: 0,
      taskCount: 0,
    };

    for (const task of submission.tasks) {
      entry.earned += task.pointsEarned ?? 0;
      entry.max += task.maxPoints ?? 0;
      entry.taskCount += 1;

      subchapter.earned += task.pointsEarned ?? 0;
      subchapter.max += task.maxPoints ?? 0;
      subchapter.taskCount += 1;
    }

    entry.submissionIds.add(submission.id);
    entry.subchapters.set(submission.subchapterId, subchapter);
    chapters.set(submission.chapterId, entry);
  }

  return Array.from(chapters.values())
    .map((entry) => ({
      chapterId: entry.chapterId,
      chapterTitle: entry.chapterTitle,
      chapterOrder: entry.chapterOrder,
      courseId: entry.courseId,
      courseTitle: entry.courseTitle,
      percentage: roundTo(toPercentage(entry.earned, entry.max)),
      taskCount: entry.taskCount,
      submissionCount: entry.submissionIds.size,
      enoughData: entry.taskCount >= minTasks,
      weakestSubchapters: Array.from(entry.subchapters.entries())
        .map(([subchapterId, subchapter]) => ({
          subchapterId,
          subchapterTitle: subchapter.title,
          percentage: roundTo(toPercentage(subchapter.earned, subchapter.max)),
          taskCount: subchapter.taskCount,
        }))
        .sort((a, b) => a.percentage - b.percentage),
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

/** Najsłabszy rozdział, ale wyłącznie spośród tych z wiarygodną próbką. */
export function findWeakestChapter(
  chapters: ChapterPerformance[]
): ChapterPerformance | null {
  const reliable = chapters.filter((chapter) => chapter.enoughData);

  if (reliable.length === 0) {
    return null;
  }

  return reliable.reduce((weakest, chapter) =>
    chapter.percentage < weakest.percentage ? chapter : weakest
  );
}

/** Najmocniejszy rozdział — komunikat rozwojowy potrzebuje też pozytywu. */
export function findStrongestChapter(
  chapters: ChapterPerformance[]
): ChapterPerformance | null {
  const reliable = chapters.filter((chapter) => chapter.enoughData);

  if (reliable.length === 0) {
    return null;
  }

  return reliable.reduce((strongest, chapter) =>
    chapter.percentage > strongest.percentage ? chapter : strongest
  );
}
