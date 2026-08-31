"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatisticsOverview } from "@/lib/student-analytics";
import { Award, Flame, Target, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  overview: StatisticsOverview;
}

/** Kafelki KPI: średnia, trend, passa, jakość pojedynczych zadań. */
export function StatsKpiRow({ overview }: Props) {
  const TrendIcon =
    overview.trend.direction === "down" ? TrendingDown : TrendingUp;

  const trendColor =
    overview.trend.direction === "down"
      ? "text-amber-600"
      : overview.trend.direction === "up"
      ? "text-emerald-600"
      : "text-gray-500";

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Średni wynik</CardTitle>
          <Award className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{overview.averagePercentage}%</div>
          <p className="text-xs text-gray-500 mt-1">
            {overview.totalPointsEarned} / {overview.totalPointsMax} punktów z{" "}
            {overview.gradedSubmissions} sprawdzonych prac
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trend</CardTitle>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${trendColor}`}>
            {overview.trend.enoughData
              ? `${overview.trend.slopePerSubmission > 0 ? "+" : ""}${
                  overview.trend.slopePerSubmission
                } p.p.`
              : "—"}
          </div>
          <p className="text-xs text-gray-500 mt-1">{overview.trend.message}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Passa</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{overview.currentStreak}</div>
          <p className="text-xs text-gray-500 mt-1">
            prac z rzędu oddanych i sprawdzonych
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Zadania na komplet
          </CardTitle>
          <Target className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{overview.perfectTasks}</div>
          <p className="text-xs text-gray-500 mt-1">
            z {overview.totalTasks} ocenionych zadań ({overview.weakTasks}{" "}
            poniżej 50%)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
