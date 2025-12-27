"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  TrendingUp,
  Award,
  Target,
  Calendar,
  BookOpen,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Rejestracja komponentów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Task {
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string | null;
  teacherComment: string | null;
  teacherEdited: boolean;
}

interface Submission {
  id: string;
  fileName: string;
  status: string;
  submittedAt: string;
  subchapter: {
    title: string;
    chapter: {
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
  tasks: Task[];
  review: {
    approved: boolean;
    generalComment: string | null;
    reviewedAt: string;
  } | null;
}

interface Course {
  id: string;
  title: string;
}

export default function StudentStatisticsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/submissions");
      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions || []);
        setCourses(data.courses || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać statystyk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obliczenia statystyczne
  const calculateStats = () => {
    // Tylko zaakceptowane prace
    const approvedSubmissions = submissions.filter(
      (s) => s.review?.approved === true && s.tasks && s.tasks.length > 0
    );

    if (approvedSubmissions.length === 0) {
      return {
        totalSubmissions: submissions.length,
        approvedSubmissions: 0,
        averagePercentage: 0,
        totalPointsEarned: 0,
        totalPointsMax: 0,
        pendingSubmissions: submissions.filter((s) => !s.review).length,
        personalBest: 0,
        lowestScore: 0,
        taskStats: {
          totalTasks: 0,
          perfectTasks: 0,
          failedTasks: 0,
        },
      };
    }

    let totalPointsEarned = 0;
    let totalPointsMax = 0;
    let allPercentages: number[] = [];

    // Statystyki zadań
    let totalTasks = 0;
    let perfectTasks = 0; // Zadania z pełną punktacją
    let failedTasks = 0; // Zadania z <50% punktów

    approvedSubmissions.forEach((submission) => {
      let submissionPointsEarned = 0;
      let submissionPointsMax = 0;

      submission.tasks.forEach((task) => {
        totalPointsEarned += task.pointsEarned;
        totalPointsMax += task.maxPoints;
        submissionPointsEarned += task.pointsEarned;
        submissionPointsMax += task.maxPoints;

        totalTasks++;

        // Analiza pojedynczych zadań
        const taskPercentage =
          task.maxPoints > 0 ? (task.pointsEarned / task.maxPoints) * 100 : 0;
        if (taskPercentage === 100) perfectTasks++;
        if (taskPercentage < 50) failedTasks++;
      });

      // Procent dla całej pracy
      if (submissionPointsMax > 0) {
        allPercentages.push(
          (submissionPointsEarned / submissionPointsMax) * 100
        );
      }
    });

    const averagePercentage =
      totalPointsMax > 0 ? (totalPointsEarned / totalPointsMax) * 100 : 0;

    const personalBest =
      allPercentages.length > 0 ? Math.max(...allPercentages) : 0;
    const lowestScore =
      allPercentages.length > 0 ? Math.min(...allPercentages) : 0;

    return {
      totalSubmissions: submissions.length,
      approvedSubmissions: approvedSubmissions.length,
      averagePercentage: Math.round(averagePercentage),
      totalPointsEarned,
      totalPointsMax,
      pendingSubmissions: submissions.filter((s) => !s.review).length,
      personalBest: Math.round(personalBest),
      lowestScore: Math.round(lowestScore),
      taskStats: {
        totalTasks,
        perfectTasks,
        failedTasks,
      },
    };
  };

  // Dane do wykresu słupkowego - procent punktów dla każdej pracy
  const prepareChartData = () => {
    const checkedSubmissions = submissions
      .filter(
        (s) => s.review?.approved === true && s.tasks && s.tasks.length > 0
      )
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );

    const labels = checkedSubmissions.map((submission) => {
      const date = new Date(submission.submittedAt).toLocaleDateString(
        "pl-PL",
        {
          day: "2-digit",
          month: "2-digit",
        }
      );
      const shortTitle = submission.subchapter.title.substring(0, 20);
      return `${date}\n${shortTitle}${
        submission.subchapter.title.length > 20 ? "..." : ""
      }`;
    });

    const percentages = checkedSubmissions.map((submission) => {
      let pointsEarned = 0;
      let pointsMax = 0;

      submission.tasks.forEach((task) => {
        pointsEarned += task.pointsEarned;
        pointsMax += task.maxPoints;
      });

      return pointsMax > 0 ? (pointsEarned / pointsMax) * 100 : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Procent punktów (%)",
          data: percentages,
          backgroundColor: percentages.map((p) => {
            if (p >= 90) return "rgba(34, 197, 94, 0.8)"; // Zielony
            if (p >= 75) return "rgba(59, 130, 246, 0.8)"; // Niebieski
            if (p >= 50) return "rgba(251, 146, 60, 0.8)"; // Pomarańczowy
            return "rgba(239, 68, 68, 0.8)"; // Czerwony
          }),
          borderColor: percentages.map((p) => {
            if (p >= 90) return "rgb(34, 197, 94)";
            if (p >= 75) return "rgb(59, 130, 246)";
            if (p >= 50) return "rgb(251, 146, 60)";
            return "rgb(239, 68, 68)";
          }),
          borderWidth: 2,
        },
      ],
    };
  };

  // Dane do wykresu liniowego - trend postępów w czasie
  const prepareTrendData = () => {
    const checkedSubmissions = submissions
      .filter(
        (s) => s.review?.approved === true && s.tasks && s.tasks.length > 0
      )
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );

    const labels = checkedSubmissions.map((submission) => {
      const shortTitle = submission.subchapter.title.substring(0, 25);
      return (
        shortTitle + (submission.subchapter.title.length > 25 ? "..." : "")
      );
    });

    const percentages = checkedSubmissions.map((submission) => {
      let pointsEarned = 0;
      let pointsMax = 0;

      submission.tasks.forEach((task) => {
        pointsEarned += task.pointsEarned;
        pointsMax += task.maxPoints;
      });

      return pointsMax > 0 ? (pointsEarned / pointsMax) * 100 : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Postęp (%)",
          data: percentages,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${Math.round(context.parsed.y)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
        },
        title: {
          display: true,
          text: "Procent punktów",
        },
      },
      x: {
        title: {
          display: true,
          text: "Praca domowa",
        },
      },
    },
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Statystyki moich wyników
        </h1>
        <p className="text-gray-500 mt-2">
          Przegląd Twoich postępów i osiągnięć w nauce
        </p>
      </div>

      {/* Karty z podsumowaniem */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Średnia ocen</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averagePercentage}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalPointsEarned} / {stats.totalPointsMax} punktów
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Best</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.personalBest}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Najlepszy wynik w historii
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Perfekcyjne zadania
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.taskStats.perfectTasks}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              z {stats.taskStats.totalTasks} zadań (100% punktów)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trudne zadania
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.taskStats.failedTasks}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              zadań z wynikiem &lt;50%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wykres słupkowy - wyniki poszczególnych prac */}
      {stats.approvedSubmissions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Wyniki poszczególnych prac domowych
            </CardTitle>
            <p className="text-sm text-gray-500">
              Procent zdobytych punktów dla każdej sprawdzonej pracy
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <Bar data={prepareChartData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wykres liniowy - trend postępów */}
      {stats.approvedSubmissions > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trend postępów w czasie
            </CardTitle>
            <p className="text-sm text-gray-500">
              Jak zmieniają się Twoje wyniki w kolejnych pracach
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={prepareTrendData()} options={trendOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Komunikat gdy brak danych */}
      {stats.approvedSubmissions === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Brak zaakceptowanych prac
                </h3>
                <p className="text-gray-500 mt-2">
                  Kiedy Twoje prace zostaną sprawdzone i zaakceptowane przez
                  nauczyciela, tutaj pojawią się szczegółowe statystyki Twoich
                  postępów.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
