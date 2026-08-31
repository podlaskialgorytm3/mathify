"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChapterPerformance } from "@/lib/student-analytics";
import { ListOrdered } from "lucide-react";

interface Props {
  chapters: ChapterPerformance[];
}

/** Paleta stonowana, celowo bez ściany czerwieni. */
function barColor(percentage: number): string {
  if (percentage >= 85) return "bg-emerald-500";
  if (percentage >= 70) return "bg-sky-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-rose-400";
}

export function WeaknessList({ chapters }: Props) {
  if (chapters.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5" />
          Rozdziały od najsłabszego
        </CardTitle>
        <p className="text-sm text-gray-500">
          Obok procentu podajemy liczbę zadań, na której policzono wynik.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {chapters.map((chapter) => (
          <div key={chapter.chapterId} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  {chapter.chapterTitle}
                </p>
                <p className="text-xs text-gray-500">
                  {chapter.courseTitle} · {chapter.taskCount} zadań ·{" "}
                  {chapter.submissionCount} prac
                  {!chapter.enoughData && (
                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                      za mało danych
                    </span>
                  )}
                </p>
              </div>
              <span className="text-lg font-semibold">
                {chapter.percentage}%
              </span>
            </div>

            <div className="h-2 w-full rounded bg-gray-100">
              <div
                className={`h-2 rounded ${
                  chapter.enoughData
                    ? barColor(chapter.percentage)
                    : "bg-gray-300"
                }`}
                style={{ width: `${Math.min(100, chapter.percentage)}%` }}
              />
            </div>

            {chapter.enoughData && chapter.weakestSubchapters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chapter.weakestSubchapters.slice(0, 3).map((subchapter) => (
                  <Link
                    key={subchapter.subchapterId}
                    href={`/dashboard/student/courses/${chapter.courseId}/subchapters/${subchapter.subchapterId}`}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-sky-300 hover:text-sky-700"
                  >
                    {subchapter.subchapterTitle}: {subchapter.percentage}%
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
