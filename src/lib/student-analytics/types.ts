/**
 * Znormalizowany model danych wejściowych dla statystyk ucznia.
 *
 * Warstwa obliczeń celowo nie zna Prismy — dzięki temu całą analitykę
 * da się testować bez bazy danych.
 */

export interface AnalyticsTask {
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string | null;
  teacherComment: string | null;
  teacherEdited: boolean;
}

export interface AnalyticsSubmission {
  id: string;
  submittedAt: string;
  reviewedAt: string | null;
  /** Praca sprawdzona przez nauczyciela — tylko takie dane są podstawą diagnozy. */
  reviewed: boolean;
  approved: boolean | null;
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  subchapterId: string;
  subchapterTitle: string;
  subchapterOrder: number;
  /** Czy uczeń otworzył jakikolwiek materiał podrozdziału PRZED oddaniem pracy. */
  viewedMaterialsBeforeSubmission: boolean;
  tasks: AnalyticsTask[];
}

export interface PointsSummary {
  earned: number;
  max: number;
  percentage: number;
}

export interface ChapterPerformance {
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  courseId: string;
  courseTitle: string;
  percentage: number;
  taskCount: number;
  submissionCount: number;
  /** Czy próbka jest wystarczająca, aby traktować wynik jako diagnozę. */
  enoughData: boolean;
  weakestSubchapters: Array<{
    subchapterId: string;
    subchapterTitle: string;
    percentage: number;
    taskCount: number;
  }>;
}

export interface TaskPositionPerformance {
  taskNumber: number;
  percentage: number;
  taskCount: number;
  enoughData: boolean;
}

export interface TrendPoint {
  submissionId: string;
  label: string;
  courseId: string;
  courseTitle: string;
  submittedAt: string;
  percentage: number;
  movingAverage: number | null;
  trendValue: number | null;
}

export interface TrendSummary {
  slopePerSubmission: number;
  direction: "up" | "down" | "flat";
  message: string;
  enoughData: boolean;
}

export interface ErrorCategorySummary {
  categoryId: string;
  label: string;
  occurrences: number;
  lostPoints: number;
  examples: string[];
}

export interface ActivityDay {
  date: string;
  submissions: number;
}

export interface ActivitySummary {
  days: ActivityDay[];
  currentStreak: number;
  longestStreak: number;
  averageDaysBetweenSubmissions: number | null;
  averageReviewWaitHours: number | null;
  submissionsLast30Days: number;
}

export interface MaterialImpactSummary {
  enoughData: boolean;
  withMaterials: { submissions: number; percentage: number };
  withoutMaterials: { submissions: number; percentage: number };
  differencePercentagePoints: number;
  message: string;
}

export interface RecommendationLink {
  label: string;
  href: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  links: RecommendationLink[];
}
