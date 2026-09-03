import { prisma } from "@/lib/prisma";

import { STATISTICS_RANGES, type StatisticsRange } from "./constants";
import type { AnalyticsSubmission } from "./types";

export interface StatisticsQuery {
  courseId?: string;
  range: StatisticsRange;
}

/**
 * Parsuje parametry zapytania statystyk.
 *
 * Świadomie NIE przyjmujemy `studentId`, bo zakres danych zawsze wynika
 * z sesji, inaczej endpointy stałyby się prostą drogą do wycieku
 * wyników innych uczniów.
 */
export function parseStatisticsQuery(searchParams: URLSearchParams): StatisticsQuery {
  const courseId = searchParams.get("courseId")?.trim();
  const rawRange = searchParams.get("range")?.trim() ?? "all";

  const range: StatisticsRange = Object.prototype.hasOwnProperty.call(
    STATISTICS_RANGES,
    rawRange
  )
    ? (rawRange as StatisticsRange)
    : "all";

  return {
    courseId: courseId && courseId.length > 0 ? courseId : undefined,
    range,
  };
}

export function getRangeStartDate(
  range: StatisticsRange,
  now: Date = new Date()
): Date | null {
  const days = STATISTICS_RANGES[range];

  if (days === null) {
    return null;
  }

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export interface StudentAnalyticsData {
  submissions: AnalyticsSubmission[];
  courses: Array<{ id: string; title: string }>;
}

/**
 * Pobiera i normalizuje dane potrzebne do wszystkich statystyk ucznia.
 * Liczenie odbywa się na serwerze, a przeglądarka dostaje gotowe agregaty.
 */
export async function getStudentAnalyticsData(
  studentId: string,
  query: StatisticsQuery,
  now: Date = new Date()
): Promise<StudentAnalyticsData> {
  const rangeStart = getRangeStartDate(query.range, now);

  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      ...(rangeStart ? { submittedAt: { gte: rangeStart } } : {}),
      ...(query.courseId
        ? { subchapter: { chapter: { courseId: query.courseId } } }
        : {}),
    },
    select: {
      id: true,
      submittedAt: true,
      subchapter: {
        select: {
          id: true,
          title: true,
          order: true,
          chapter: {
            select: {
              id: true,
              title: true,
              order: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      },
      tasks: {
        select: {
          taskNumber: true,
          pointsEarned: true,
          maxPoints: true,
          comment: true,
          teacherComment: true,
        },
        orderBy: { taskNumber: "asc" },
      },
      review: { select: { approved: true, reviewedAt: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const viewsBySubchapter = await getMaterialViewsBySubchapter(studentId);

  const normalized: AnalyticsSubmission[] = submissions.map((submission) => {
    const submittedAt = submission.submittedAt;
    const views = viewsBySubchapter.get(submission.subchapter.id) ?? [];

    return {
      id: submission.id,
      submittedAt: submittedAt.toISOString(),
      reviewedAt: submission.review?.reviewedAt?.toISOString() ?? null,
      reviewed: submission.review !== null,
      approved: submission.review?.approved ?? null,
      courseId: submission.subchapter.chapter.course.id,
      courseTitle: submission.subchapter.chapter.course.title,
      chapterId: submission.subchapter.chapter.id,
      chapterTitle: submission.subchapter.chapter.title,
      chapterOrder: submission.subchapter.chapter.order,
      subchapterId: submission.subchapter.id,
      subchapterTitle: submission.subchapter.title,
      subchapterOrder: submission.subchapter.order,
      viewedMaterialsBeforeSubmission: views.some(
        (viewedAt) => viewedAt.getTime() <= submittedAt.getTime()
      ),
      tasks: submission.tasks.map((task) => ({
        taskNumber: task.taskNumber,
        pointsEarned: task.pointsEarned,
        maxPoints: task.maxPoints,
        comment: task.comment,
        teacherComment: task.teacherComment,
      })),
    };
  });

  const coursesMap = new Map<string, { id: string; title: string }>();

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId },
    select: { course: { select: { id: true, title: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  enrollments.forEach((enrollment) => {
    coursesMap.set(enrollment.course.id, {
      id: enrollment.course.id,
      title: enrollment.course.title,
    });
  });

  normalized.forEach((submission) => {
    if (!coursesMap.has(submission.courseId)) {
      coursesMap.set(submission.courseId, {
        id: submission.courseId,
        title: submission.courseTitle,
      });
    }
  });

  return { submissions: normalized, courses: Array.from(coursesMap.values()) };
}

async function getMaterialViewsBySubchapter(
  studentId: string
): Promise<Map<string, Date[]>> {
  const views = await prisma.materialView.findMany({
    where: { studentId },
    select: {
      viewedAt: true,
      material: {
        select: { subchapters: { select: { subchapterId: true } } },
      },
    },
  });

  const map = new Map<string, Date[]>();

  for (const view of views) {
    for (const link of view.material.subchapters) {
      const entry = map.get(link.subchapterId) ?? [];
      entry.push(view.viewedAt);
      map.set(link.subchapterId, entry);
    }
  }

  return map;
}
