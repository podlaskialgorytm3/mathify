"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import LaTeXRenderer from "@/components/LaTeXRenderer";
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Bot,
  User,
  Download,
  X,
  Star,
  Trash2,
} from "lucide-react";

interface Submission {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  status: string;
  aiScore: number | null;
  aiFeedback: string | null;
  submittedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subchapter: {
    id: string;
    title: string;
    order: number;
    chapter: {
      id: string;
      title: string;
      order: number;
      course: {
        id: string;
        title: string;
      };
    };
  };
  review: {
    id: string;
    generalComment: string | null;
    approved: boolean;
    reviewedAt: string;
    teacher: {
      firstName: string;
      lastName: string;
    };
  } | null;
  tasks: Array<{
    id: string;
    taskNumber: number;
    pointsEarned: number;
    maxPoints: number;
  }>;
}

interface Stats {
  total: number;
  pending: number;
  aiChecked: number;
  reviewing: number;
  approved: number;
  rejected: number;
}

interface TaskInput {
  id?: string;
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string;
  teacherComment: string;
}

export default function TeacherSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    aiChecked: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editedTasks, setEditedTasks] = useState<TaskInput[]>([]);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [aiJsonData, setAiJsonData] = useState("");
  const [editedJsonData, setEditedJsonData] = useState("");
  const [showLatexPreview, setShowLatexPreview] = useState(false);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCourse !== "all") params.append("courseId", selectedCourse);

      const response = await fetch(
        `/api/teacher/submissions?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions);
        setCourses(data.courses);
        setStats(data.stats);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać prac",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania prac",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę pracę domową?")) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/submissions/${submissionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete submission");
      }

      toast({
        title: "Sukces",
        description: "Praca domowa została usunięta",
      });

      // Zamknij modal jeśli był otwarty
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }

      // Odśwież listę
      await fetchSubmissions();
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć pracy",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [selectedStatus, selectedCourse]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: "Oczekujące",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      AI_CHECKED: {
        label: "Sprawdzone przez AI",
        className: "bg-blue-100 text-blue-800",
        icon: Bot,
      },
      TEACHER_REVIEWING: {
        label: "W trakcie sprawdzania",
        className: "bg-purple-100 text-purple-800",
        icon: User,
      },
      APPROVED: {
        label: "Zaakceptowane",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      REJECTED: {
        label: "Odrzucone",
        className: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const addTask = () => {
    const nextTaskNumber =
      editedTasks.length > 0
        ? Math.max(...editedTasks.map((t) => t.taskNumber)) + 1
        : 1;

    setEditedTasks([
      ...editedTasks,
      {
        taskNumber: nextTaskNumber,
        pointsEarned: 0,
        maxPoints: 0,
        comment: "",
        teacherComment: "",
      },
    ]);
  };

  const removeTask = (taskNumber: number) => {
    setEditedTasks(editedTasks.filter((t) => t.taskNumber !== taskNumber));
  };

  const updateTask = (
    taskNumber: number,
    field: keyof TaskInput,
    value: any
  ) => {
    setEditedTasks(
      editedTasks.map((t) => {
        if (t.taskNumber !== taskNumber) return t;

        const updatedTask = { ...t, [field]: value };

        // Walidacja: punkty zdobyte nie mogą być większe niż max punktów
        if (
          field === "pointsEarned" &&
          value > t.maxPoints &&
          t.maxPoints > 0
        ) {
          updatedTask.pointsEarned = t.maxPoints;
        }

        // Walidacja: max punktów nie może być mniejsze niż punkty zdobyte
        if (field === "maxPoints" && value < t.pointsEarned && value >= 0) {
          updatedTask.maxPoints = t.pointsEarned;
        }

        return updatedTask;
      })
    );
  };

  const openSubmissionDetails = async (submission: Submission) => {
    try {
      const response = await fetch(`/api/teacher/submissions/${submission.id}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedSubmission(data.submission);
        setReviewComment("");
        // Załaduj istniejące zadania
        setEditedTasks(data.submission.tasks || []);
        // Załaduj JSON z AI (lub pusty jeśli nie ma)
        if (data.submission.aiResult?.rawResponse) {
          setAiJsonData(data.submission.aiResult.rawResponse);
          setEditedJsonData(data.submission.aiResult.rawResponse);
        } else {
          setAiJsonData("");
          setEditedJsonData("");
        }
      } else {
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać szczegółów pracy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania szczegółów",
        variant: "destructive",
      });
    }
  };

  const applyJsonToTasks = () => {
    try {
      // Parse JSON
      const parsed = JSON.parse(editedJsonData);

      if (!Array.isArray(parsed)) {
        toast({
          title: "Błąd",
          description: "JSON musi być tablicą zadań",
          variant: "destructive",
        });
        return;
      }

      // Mapuj JSON do TaskInput
      const newTasks: TaskInput[] = parsed.map((task: any, index: number) => {
        const taskNumberMatch = task.Zadanie?.match(/\d+/);
        const taskNumber = taskNumberMatch
          ? parseInt(taskNumberMatch[0])
          : index + 1;

        return {
          taskNumber,
          pointsEarned: task["Punkty Zdobyte"] || 0,
          maxPoints: task["Max punktów"] || 10,
          comment: task.Komentarz || "",
          teacherComment: "",
        };
      });

      setEditedTasks(newTasks);
      setShowJsonEditor(false);

      toast({
        title: "Sukces",
        description: `Zaktualizowano ${newTasks.length} zadań z JSON`,
      });
    } catch (error) {
      toast({
        title: "Błąd parsowania",
        description: "Nieprawidłowy format JSON",
        variant: "destructive",
      });
    }
  };

  const submitReview = async (newStatus: string, approved?: boolean) => {
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/teacher/submissions/${selectedSubmission.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            approved: approved,
            generalComment: reviewComment || null,
            tasks: editedTasks,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setSelectedSubmission(null);
        fetchSubmissions();
      } else {
        toast({
          title: "Błąd",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas zapisywania oceny",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprawdzanie Prac</h1>
          <p className="text-gray-600 mt-1">
            Przeglądaj i oceniaj prace przesłane przez uczniów
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Wszystkie</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setSelectedStatus("PENDING")}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Oczekujące</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setSelectedStatus("AI_CHECKED")}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Sprawdzone AI</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.aiChecked}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setSelectedStatus("TEACHER_REVIEWING")}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">W trakcie</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.reviewing}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setSelectedStatus("APPROVED")}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Zaakceptowane</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setSelectedStatus("REJECTED")}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Odrzucone</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">
                <Search className="w-4 h-4 inline mr-2" />
                Szukaj
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="Imię, nazwisko, kurs, podrozdział..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="status-filter">
                <Filter className="w-4 h-4 inline mr-2" />
                Status pracy
              </Label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="PENDING">Oczekujące</option>
                <option value="AI_CHECKED">Sprawdzone przez AI</option>
                <option value="TEACHER_REVIEWING">W trakcie sprawdzania</option>
                <option value="APPROVED">Zaakceptowane</option>
                <option value="REJECTED">Odrzucone</option>
              </select>
            </div>
            <div>
              <Label htmlFor="course-filter">
                <Filter className="w-4 h-4 inline mr-2" />
                Filtruj po kursie
              </Label>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Wszystkie kursy</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {submissions.filter((submission) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          submission.student.firstName.toLowerCase().includes(search) ||
          submission.student.lastName.toLowerCase().includes(search) ||
          submission.subchapter.chapter.course.title
            .toLowerCase()
            .includes(search) ||
          submission.subchapter.title.toLowerCase().includes(search) ||
          submission.subchapter.chapter.title.toLowerCase().includes(search)
        );
      }).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {selectedStatus !== "all" ||
              selectedCourse !== "all" ||
              searchTerm
                ? "Nie znaleziono prac spełniających kryteria"
                : "Brak prac do sprawdzenia"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions
            .filter((submission) => {
              if (!searchTerm) return true;
              const search = searchTerm.toLowerCase();
              return (
                submission.student.firstName.toLowerCase().includes(search) ||
                submission.student.lastName.toLowerCase().includes(search) ||
                submission.subchapter.chapter.course.title
                  .toLowerCase()
                  .includes(search) ||
                submission.subchapter.title.toLowerCase().includes(search) ||
                submission.subchapter.chapter.title
                  .toLowerCase()
                  .includes(search)
              );
            })
            .map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-blue-600">
                            {submission.student.firstName[0]}
                            {submission.student.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {submission.student.firstName}{" "}
                              {submission.student.lastName}
                            </h3>
                            {getStatusBadge(submission.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <strong>Kurs:</strong>{" "}
                              {submission.subchapter.chapter.course.title}
                            </p>
                            <p>
                              <strong>Rozdział:</strong>{" "}
                              {submission.subchapter.chapter.order}.{" "}
                              {submission.subchapter.chapter.title}
                            </p>
                            <p>
                              <strong>Podrozdział:</strong>{" "}
                              {submission.subchapter.chapter.order}.
                              {submission.subchapter.order}{" "}
                              {submission.subchapter.title}
                            </p>
                            <p>
                              <strong>Przesłano:</strong>{" "}
                              {new Date(submission.submittedAt).toLocaleString(
                                "pl-PL"
                              )}
                            </p>
                          </div>
                          {submission.aiScore !== null && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Bot className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-blue-900">
                                  Ocena AI: {submission.aiScore}/100
                                </span>
                              </div>
                              {submission.aiFeedback && (
                                <p className="text-blue-800 text-xs">
                                  {submission.aiFeedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => openSubmissionDetails(submission)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Sprawdź
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Szczegóły pracy</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Informacje o uczniu</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Imię i nazwisko</p>
                    <p className="font-medium">
                      {selectedSubmission.student.firstName}{" "}
                      {selectedSubmission.student.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">
                      {selectedSubmission.student.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kurs</p>
                    <p className="font-medium">
                      {selectedSubmission.subchapter.chapter.course.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Podrozdział</p>
                    <p className="font-medium">
                      {selectedSubmission.subchapter.chapter.order}.
                      {selectedSubmission.subchapter.order}{" "}
                      {selectedSubmission.subchapter.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Content */}
              <div>
                <h3 className="font-semibold mb-2">Przesłana praca</h3>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Nazwa pliku:</p>
                    <p className="font-medium">{selectedSubmission.fileName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(selectedSubmission.filePath, "_blank")
                      }
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Zobacz
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(selectedSubmission.filePath, "_blank")
                      }
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Pobierz
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selectedSubmission.id)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Usuń
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowJsonEditor(true)}
                      className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 ml-auto"
                    >
                      <Bot className="w-4 h-4" />
                      Podejrzyj JSON od AI
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI Feedback with Student Score */}
              {selectedSubmission.aiFeedback && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">
                        Ocena AI ({selectedSubmission.aiScore}/100)
                      </h3>
                    </div>
                    {selectedSubmission.tasks &&
                      selectedSubmission.tasks.length > 0 && (
                        <div className="text-right">
                          {(() => {
                            const totalEarned = selectedSubmission.tasks.reduce(
                              (sum, t) => sum + t.pointsEarned,
                              0
                            );
                            const totalMax = selectedSubmission.tasks.reduce(
                              (sum, t) => sum + t.maxPoints,
                              0
                            );
                            const percentage =
                              totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;

                            return (
                              <div className="bg-green-100 px-3 py-1 rounded-lg border border-green-300">
                                <p className="text-xs text-green-700 font-medium">
                                  Wynik ucznia
                                </p>
                                <p className="text-xl font-bold text-green-700">
                                  {percentage.toFixed(0)}%
                                </p>
                                <p className="text-xs text-green-600">
                                  {totalEarned.toFixed(1)} /{" "}
                                  {totalMax.toFixed(1)} pkt
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                  </div>
                  <p className="text-sm text-blue-800">
                    {selectedSubmission.aiFeedback}
                  </p>
                </div>
              )}

              {/* Previous Review */}
              {selectedSubmission.review && (
                <div>
                  <h3 className="font-semibold mb-2">Poprzednia ocena</h3>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {selectedSubmission.review.teacher.firstName}{" "}
                        {selectedSubmission.review.teacher.lastName}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(
                          selectedSubmission.review.reviewedAt
                        ).toLocaleString("pl-PL")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1">
                      Status:{" "}
                      {selectedSubmission.review.approved
                        ? "Zaakceptowana"
                        : "Odrzucona"}
                    </p>
                    {selectedSubmission.review.generalComment && (
                      <p className="text-sm text-gray-700">
                        {selectedSubmission.review.generalComment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Review Form */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Twoja ocena</h3>
                <div className="space-y-4">
                  {/* Tasks Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Zadania</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLatexPreview(!showLatexPreview)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {showLatexPreview ? "Edycja" : "Podgląd LaTeX"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTask}
                        >
                          Dodaj Zadanie
                        </Button>
                      </div>
                    </div>

                    {editedTasks.length > 0 && (
                      <div className="space-y-2">
                        {editedTasks.map((task) => (
                          <div
                            key={task.taskNumber}
                            className="p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 flex gap-3 items-end">
                                <div className="w-32">
                                  <Label className="text-xs">Zadanie</Label>
                                  <Input
                                    value={`Zadanie ${task.taskNumber}`}
                                    disabled
                                    className="bg-white"
                                  />
                                </div>
                                <div className="w-32">
                                  <Label className="text-xs">
                                    Punkty zdobyte
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={task.maxPoints || undefined}
                                    step="0.5"
                                    value={task.pointsEarned}
                                    onChange={(e) => {
                                      const val =
                                        parseFloat(e.target.value) || 0;
                                      updateTask(
                                        task.taskNumber,
                                        "pointsEarned",
                                        val
                                      );
                                    }}
                                    className="bg-white"
                                  />
                                </div>
                                <div className="w-32">
                                  <Label className="text-xs">Max punktów</Label>
                                  <Input
                                    type="number"
                                    min={task.pointsEarned || 0}
                                    step="0.5"
                                    value={task.maxPoints}
                                    onChange={(e) => {
                                      const val =
                                        parseFloat(e.target.value) || 0;
                                      updateTask(
                                        task.taskNumber,
                                        "maxPoints",
                                        val
                                      );
                                    }}
                                    className="bg-white"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs">Komentarz</Label>
                                  {showLatexPreview ? (
                                    <div className="w-full p-2 border rounded-md min-h-[60px] bg-white">
                                      {task.teacherComment || task.comment ? (
                                        <LaTeXRenderer
                                          content={
                                            task.teacherComment ||
                                            task.comment ||
                                            ""
                                          }
                                        />
                                      ) : (
                                        <p className="text-gray-400 italic text-xs">
                                          Brak komentarza
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <textarea
                                      value={
                                        task.teacherComment ||
                                        task.comment ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        updateTask(
                                          task.taskNumber,
                                          "teacherComment",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Komentarz..."
                                      className="bg-white w-full p-2 border rounded-md min-h-[40px] resize-y"
                                    />
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTask(task.taskNumber)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="review-feedback">Komentarz ogólny</Label>
                    <textarea
                      id="review-feedback"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full p-2 border rounded-md min-h-[120px]"
                      placeholder="Dodaj swój komentarz do pracy ucznia..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => submitReview("TEACHER_REVIEWING")}
                      disabled={submitting}
                    >
                      Zapisz jako wersję roboczą
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => submitReview("REJECTED", false)}
                      disabled={submitting}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Odrzuć
                    </Button>
                    <Button
                      onClick={() => submitReview("APPROVED", true)}
                      disabled={submitting}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Zaakceptuj
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* JSON Editor Modal */}
      {showJsonEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Edycja JSON od AI
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowJsonEditor(false);
                    setEditedJsonData(aiJsonData); // Reset do oryginalnego
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {editedJsonData ? (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Instrukcja:</strong> Edytuj poniższy JSON, aby
                      dostosować wyniki sprawdzenia AI. Po zatwierdzeniu zadania
                      zostaną zaktualizowane na podstawie tego JSON.
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="json-editor" className="mb-2">
                      JSON z wynikami zadań:
                    </Label>
                    <textarea
                      id="json-editor"
                      value={editedJsonData}
                      onChange={(e) => setEditedJsonData(e.target.value)}
                      className="flex-1 min-h-[400px] p-4 border rounded-lg font-mono text-sm resize-none"
                      placeholder='[{"Zadanie":"Zadanie 1","Punkty Zdobyte":8,"Max punktów":10,"Komentarz":"..."}]'
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowJsonEditor(false);
                        setEditedJsonData(aiJsonData);
                      }}
                    >
                      Anuluj
                    </Button>
                    <Button onClick={applyJsonToTasks} className="gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Zatwierdź i zastosuj
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Brak odpowiedzi od AI</strong>
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      Ta praca domowa nie została jeszcze sprawdzona przez AI
                      lub AI nie zwróciło żadnej odpowiedzi. Możesz ręcznie
                      wprowadzić JSON z zadaniami poniżej.
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="json-editor" className="mb-2">
                      Wprowadź JSON z wynikami zadań:
                    </Label>
                    <textarea
                      id="json-editor"
                      value={editedJsonData}
                      onChange={(e) => setEditedJsonData(e.target.value)}
                      className="flex-1 min-h-[400px] p-4 border rounded-lg font-mono text-sm resize-none"
                      placeholder='[{"Zadanie":"Zadanie 1","Punkty Zdobyte":8,"Max punktów":10,"Komentarz":"..."}]'
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowJsonEditor(false);
                        setEditedJsonData("");
                      }}
                    >
                      Anuluj
                    </Button>
                    <Button onClick={applyJsonToTasks} className="gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Zastosuj JSON
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
