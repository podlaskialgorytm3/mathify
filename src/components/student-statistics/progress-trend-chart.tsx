"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint, TrendSummary } from "@/lib/student-analytics";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface Props {
  points: TrendPoint[];
  summary: TrendSummary;
}

/** Trend wyników: wynik pracy + średnia krocząca (3 prace) + linia regresji. */
export function ProgressTrendChart({ points, summary }: Props) {
  if (points.length === 0) {
    return null;
  }

  const data = {
    labels: points.map((point) =>
      new Date(point.submittedAt).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Wynik pracy (%)",
        data: points.map((point) => point.percentage),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Średnia z 3 prac (%)",
        data: points.map((point) => point.movingAverage),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "transparent",
        borderDash: [4, 4],
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: "Linia trendu",
        data: points.map((point) => point.trendValue),
        borderColor: "rgb(148, 163, 184)",
        backgroundColor: "transparent",
        borderDash: [8, 4],
        pointRadius: 0,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          title: (items: Array<{ dataIndex: number }>) =>
            points[items[0].dataIndex]?.label ?? "",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (value: string | number) => `${value}%` },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trend postępów
        </CardTitle>
        <p className="text-sm text-gray-500">{summary.message}</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
