"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Subchapter {
  id: string;
  title: string;
  order: number;
  chapter: {
    id: string;
    title: string;
    order: number;
  };
}

interface Task {
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string | null;
  teacherComment: string | null;
}

interface Review {
  approved: boolean;
  generalComment: string | null;
  reviewedAt: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
}

interface Submission {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  submittedAt: string;
  student: Student;
  subchapter: Subchapter;
  tasks: Task[];
  review: Review | null;
}

interface CourseSubmissionsData {
  course: {
    id: string;
    title: string;
  };
  submissions: Submission[];
  stats: {
    total: number;
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
  };
}

export default function CourseSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<CourseSubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");

  useEffect(() => {
    fetchSubmissions();
  }, [courseId]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(
        `/api/teacher/courses/${courseId}/submissions`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch submissions");
      }

      setData(result);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać prac domowych",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "TEACHER_REVIEWING":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "TEACHER_REVIEWING":
        return <Eye className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Oczekuje";
      case "TEACHER_REVIEWING":
        return "W trakcie sprawdzania";
      case "APPROVED":
        return "Zaakceptowana";
      case "REJECTED":
        return "Odrzucona";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nie znaleziono danych</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrowanie
  const filteredSubmissions = data.submissions.filter((submission) => {
    if (statusFilter !== "all" && submission.status !== statusFilter) {
      return false;
    }
    if (studentFilter !== "all" && submission.student.id !== studentFilter) {
      return false;
    }
    return true;
  });

  // Unikalni studenci
  const uniqueStudents = Array.from(
    new Map(
      data.submissions.map((s) => [
        s.student.id,
        `${s.student.firstName} ${s.student.lastName}`,
      ])
    )
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              router.push(`/dashboard/teacher/courses/${courseId}`)
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Prace domowe</h1>
            <p className="text-gray-500">{data.course.title}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {data.stats.total}
              </p>
              <p className="text-sm text-gray-500">Wszystkie</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {data.stats.pending}
              </p>
              <p className="text-sm text-gray-500">Oczekujące</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {data.stats.reviewing}
              </p>
              <p className="text-sm text-gray-500">Sprawdzane</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {data.stats.approved}
              </p>
              <p className="text-sm text-gray-500">Zaakceptowane</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {data.stats.rejected}
              </p>
              <p className="text-sm text-gray-500">Odrzucone</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wszystkie statusy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie statusy</SelectItem>
                    <SelectItem value="PENDING">Oczekujące</SelectItem>
                    <SelectItem value="TEACHER_REVIEWING">
                      Sprawdzane
                    </SelectItem>
                    <SelectItem value="APPROVED">Zaakceptowane</SelectItem>
                    <SelectItem value="REJECTED">Odrzucone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Uczeń
                </label>
                <Select value={studentFilter} onValueChange={setStudentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wszyscy uczniowie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszyscy uczniowie</SelectItem>
                    {uniqueStudents.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 py-8">
                Brak prac domowych spełniających kryteria
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Student and Subchapter */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.student.firstName}{" "}
                          {submission.student.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {getStatusIcon(submission.status)}
                          {getStatusLabel(submission.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {submission.subchapter.chapter.order}.
                        {submission.subchapter.order}{" "}
                        {submission.subchapter.title}
                      </p>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {submission.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Przesłano:{" "}
                          {new Date(submission.submittedAt).toLocaleDateString(
                            "pl-PL",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(submission.filePath, "_blank")
                        }
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Pobierz
                      </Button>
                    </div>

                    {/* Tasks Summary */}
                    {submission.tasks.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          Ocena zadań:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {submission.tasks.map((task) => (
                            <div
                              key={task.taskNumber}
                              className="text-sm text-gray-700"
                            >
                              Zadanie {task.taskNumber}:{" "}
                              <span className="font-semibold">
                                {task.pointsEarned}/{task.maxPoints}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review */}
                    {submission.review && (
                      <div
                        className={`p-3 border rounded-lg ${
                          submission.review.approved
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Komentarz nauczyciela:
                        </p>
                        <p className="text-sm text-gray-700">
                          {submission.review.generalComment ||
                            "Brak komentarza"}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Sprawdzono przez:{" "}
                          {submission.review.teacher.firstName}{" "}
                          {submission.review.teacher.lastName} -{" "}
                          {new Date(
                            submission.review.reviewedAt
                          ).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(submission.filePath, "_blank")}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Zobacz pracę
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
