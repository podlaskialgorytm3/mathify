"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ActivityHeatmap } from "@/components/student-statistics/activity-heatmap";
import { ErrorCategories } from "@/components/student-statistics/error-categories";
import { MaterialImpactCard } from "@/components/student-statistics/material-impact-card";
import { NextStepsCard } from "@/components/student-statistics/next-steps-card";
import { ProgressTrendChart } from "@/components/student-statistics/progress-trend-chart";
import { StatsKpiRow } from "@/components/student-statistics/stats-kpi-row";
import { StrengthsRadar } from "@/components/student-statistics/strengths-radar";
import { TaskPositionChart } from "@/components/student-statistics/task-position-chart";
import { WeaknessList } from "@/components/student-statistics/weakness-list";
import type {
  ActivitySummary,
  ChapterPerformance,
  ErrorCategorySummary,
  MaterialImpactSummary,
  Recommendation,
  StatisticsOverview,
  TaskPositionPerformance,
} from "@/lib/student-analytics";
import { BookOpen } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface StatisticsState {
  overview: StatisticsOverview | null;
  chapters: ChapterPerformance[];
  positions: TaskPositionPerformance[];
  pattern: { pattern: string; message: string };
  categories: ErrorCategorySummary[];
  activity: ActivitySummary | null;
  materialImpact: MaterialImpactSummary | null;
  recommendations: Recommendation[];
  courses: Course[];
}

const EMPTY_STATE: StatisticsState = {
  overview: null,
  chapters: [],
  positions: [],
  pattern: { pattern: "unknown", message: "" },
  categories: [],
  activity: null,
  materialImpact: null,
  recommendations: [],
  courses: [],
};

const RANGE_LABELS: Record<string, string> = {
  all: "Cały okres",
  "90d": "Ostatnie 90 dni",
  "30d": "Ostatnie 30 dni",
};

export default function StudentStatisticsPage() {
  const [state, setState] = useState<StatisticsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const { toast } = useToast();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (courseId !== "all") {
      params.set("courseId", courseId);
    }
    params.set("range", range);
    return params.toString();
  }, [courseId, range]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);

    try {
      const endpoints = [
        "overview",
        "by-chapter",
        "by-task-number",
        "errors",
        "activity",
        "recommendations",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`/api/student/statistics/${endpoint}?${queryString}`)
        )
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to fetch statistics");
      }

      const [overview, byChapter, byTaskNumber, errors, activity, next] =
        await Promise.all(responses.map((response) => response.json()));

      setState({
        overview: overview.overview,
        chapters: byChapter.chapters ?? [],
        positions: byTaskNumber.positions ?? [],
        pattern: byTaskNumber.pattern ?? { pattern: "unknown", message: "" },
        categories: errors.categories ?? [],
        activity: activity.activity ?? null,
        materialImpact: activity.materialImpact ?? null,
        recommendations: next.recommendations ?? [],
        courses: overview.courses ?? [],
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać statystyk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [queryString, toast]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/4 rounded bg-gray-200" />
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 rounded bg-gray-200" />
            ))}
          </div>
          <div className="h-96 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  const overview = state.overview;
  const hasGradedData = (overview?.gradedSubmissions ?? 0) > 0;

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Statystyki moich wyników
          </h1>
          <p className="mt-2 text-gray-500">
            Diagnoza: gdzie tracisz punkty, czy się poprawiasz i co zrobić dalej
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Kurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kursy</SelectItem>
              {state.courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Zakres" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasGradedData ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 py-12 text-center">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Brak sprawdzonych prac w wybranym zakresie
                </h3>
                <p className="mt-2 text-gray-500">
                  Statystyki liczymy wyłącznie z prac sprawdzonych przez
                  nauczyciela, dzięki czemu diagnoza opiera się na finalnych
                  punktach.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {overview && <StatsKpiRow overview={overview} />}

          <Tabs defaultValue="diagnosis">
            <TabsList className="flex-wrap">
              <TabsTrigger value="diagnosis">Diagnoza</TabsTrigger>
              <TabsTrigger value="progress">Postęp</TabsTrigger>
              <TabsTrigger value="errors">Błędy</TabsTrigger>
              <TabsTrigger value="activity">Aktywność</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnosis" className="space-y-6">
              <NextStepsCard recommendations={state.recommendations} />
              <StrengthsRadar chapters={state.chapters} />
              <WeaknessList chapters={state.chapters} />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              {overview && (
                <ProgressTrendChart
                  points={overview.trendPoints}
                  summary={overview.trend}
                />
              )}
              <TaskPositionChart
                positions={state.positions}
                pattern={state.pattern}
              />
            </TabsContent>

            <TabsContent value="errors" className="space-y-6">
              <ErrorCategories categories={state.categories} />
              {overview && (
                <Card>
                  <CardContent className="space-y-2 pt-6 text-sm text-gray-600">
                    <p>
                      Zestawienie powstało z{" "}
                      <span className="font-semibold">
                        {overview.totalTasks}
                      </span>{" "}
                      sprawdzonych zadań.
                    </p>
                    <p>
                      Wszystkie statystyki liczymy z punktów finalnych, czyli
                      tych, które widzisz przy sprawdzonej pracy.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {state.activity && <ActivityHeatmap activity={state.activity} />}
              {state.materialImpact && (
                <MaterialImpactCard impact={state.materialImpact} />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
