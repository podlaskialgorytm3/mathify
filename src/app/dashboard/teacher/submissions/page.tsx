"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
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
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const openSubmissionDetails = async (submission: Submission) => {
    try {
      const response = await fetch(`/api/teacher/submissions/${submission.id}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedSubmission(data.submission);
        setReviewComment("");
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {selectedStatus !== "all" || selectedCourse !== "all"
                ? "Nie znaleziono prac spełniających kryteria"
                : "Brak prac do sprawdzenia"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
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
                  </div>
                </div>
              </div>

              {/* AI Feedback */}
              {selectedSubmission.aiFeedback && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Ocena AI ({selectedSubmission.aiScore}/100)
                    </h3>
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
                  <div>
                    <Label htmlFor="review-feedback">Komentarz</Label>
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
    </div>
  );
}
