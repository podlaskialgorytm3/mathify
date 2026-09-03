"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivitySummary } from "@/lib/student-analytics";
import { CalendarDays } from "lucide-react";

interface Props {
  activity: ActivitySummary;
}

function cellColor(submissions: number): string {
  if (submissions === 0) return "bg-gray-100";
  if (submissions === 1) return "bg-sky-300";
  if (submissions === 2) return "bg-sky-500";
  return "bg-sky-700";
}

/**
 * Heatmapa kalendarzowa w stylu "GitHub contributions" na własnym gridzie CSS,
 * bo gotowe biblioteki do tego są ciężkie i nadmiarowe.
 */
export function ActivityHeatmap({ activity }: Props) {
  const weeks: Array<typeof activity.days> = [];

  for (let index = 0; index < activity.days.length; index += 7) {
    weeks.push(activity.days.slice(index, index + 7));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Rytm pracy
        </CardTitle>
        <p className="text-sm text-gray-500">
          Kiedy oddajesz prace. To miara motywacyjna, która nie wpływa na Twoje
          wyniki.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 overflow-x-auto scroll-touch pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.submissions} prac`}
                  className={`h-3 w-3 rounded-sm ${cellColor(day.submissions)}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-gray-500">Passa</p>
            <p className="text-xl font-semibold">{activity.currentStreak}</p>
          </div>
          <div>
            <p className="text-gray-500">Najdłuższa passa</p>
            <p className="text-xl font-semibold">{activity.longestStreak}</p>
          </div>
          <div>
            <p className="text-gray-500">Prace w ostatnich 30 dniach</p>
            <p className="text-xl font-semibold">
              {activity.submissionsLast30Days}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Średnia przerwa między pracami</p>
            <p className="text-xl font-semibold">
              {activity.averageDaysBetweenSubmissions === null
                ? "brak danych"
                : `${activity.averageDaysBetweenSubmissions} dni`}
            </p>
          </div>
        </div>

        {activity.averageReviewWaitHours !== null && (
          <p className="text-xs text-gray-500">
            Średni czas oczekiwania na sprawdzenie pracy:{" "}
            {activity.averageReviewWaitHours} h
          </p>
        )}
      </CardContent>
    </Card>
  );
}
