"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChapterPerformance } from "@/lib/student-analytics";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { Radar as RadarIcon } from "lucide-react";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  chapters: ChapterPerformance[];
}

/**
 * Wykres radarowy per rozdział.
 * Na radarze pokazujemy wyłącznie rozdziały z wiarygodną próbką,
 * bo wynik z dwóch zadań to szum, a nie diagnoza.
 */
export function StrengthsRadar({ chapters }: Props) {
  const reliable = chapters.filter((chapter) => chapter.enoughData);

  if (reliable.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadarIcon className="h-5 w-5" />
            Mapa mocnych i słabych stron
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Radar pojawi się, gdy co najmniej trzy rozdziały będą miały
            wystarczającą liczbę ocenionych zadań. Poniżej znajdziesz listę
            wszystkich rozdziałów wraz z informacją o wielkości próbki.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels: reliable.map((chapter) => chapter.chapterTitle),
    datasets: [
      {
        label: "Skuteczność (%)",
        data: reliable.map((chapter) => chapter.percentage),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        pointBackgroundColor: "rgb(59, 130, 246)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 25 },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadarIcon className="h-5 w-5" />
          Mapa mocnych i słabych stron
        </CardTitle>
        <p className="text-sm text-gray-500">
          Skuteczność w poszczególnych rozdziałach materiału
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-72 sm:h-96">
          <Radar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
