"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskPositionPerformance } from "@/lib/student-analytics";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { LayoutList } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
  positions: TaskPositionPerformance[];
  pattern: { pattern: string; message: string };
}

/** Skuteczność wg numeru zadania w pracy. */
export function TaskPositionChart({ positions, pattern }: Props) {
  const reliable = positions.filter((position) => position.enoughData);

  const data = {
    labels: reliable.map((position) => `Zadanie ${position.taskNumber}`),
    datasets: [
      {
        label: "Skuteczność (%)",
        data: reliable.map((position) => position.percentage),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
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
          <LayoutList className="h-5 w-5" />
          Profil „zadanie po zadaniu"
        </CardTitle>
        <p className="text-sm text-gray-500">{pattern.message}</p>
      </CardHeader>
      <CardContent>
        {reliable.length === 0 ? (
          <p className="text-sm text-gray-500">
            Za mało ocenionych zadań na poszczególnych pozycjach, aby pokazać
            ten profil.
          </p>
        ) : (
          <div className="h-64 sm:h-80">
            <Bar data={data} options={options} />
          </div>
        )}

        {positions.some((position) => !position.enoughData) && (
          <p className="mt-3 text-xs text-gray-500">
            Pozycje zadań z małą liczbą danych zostały pominięte na wykresie.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
