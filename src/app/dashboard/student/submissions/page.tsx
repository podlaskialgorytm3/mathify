"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Search,
  Filter,
  BookOpen,
} from "lucide-react";

interface Task {
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string | null;
  teacherComment: string | null;
  teacherEdited: boolean;
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
  subchapter: {
    title: string;
    chapter: {
      title: string;
      course: {
        title: string;
      };
    };
  };
  tasks: Task[];
  review: Review | null;
}

interface Course {
  id: string;
  title: string;
}

export default function StudentSubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/student/submissions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch submissions");
      }

      setSubmissions(data.submissions);
      setCourses(data.courses);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać prac",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> =
      {
        PENDING: {
          label: "Oczekuje",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        },
        AI_CHECKED: {
          label: "Oczekuje",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        },
        TEACHER_REVIEWING: {
          label: "W trakcie sprawdzania",
          color: "bg-blue-100 text-blue-800",
          icon: Eye,
        },
        APPROVED: {
          label: "Zaakceptowane",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
        },
        REJECTED: {
          label: "Odrzucone",
          color: "bg-red-100 text-red-800",
          icon: XCircle,
        },
      };
    return configs[status] || configs.PENDING;
  };

  const calculateTotalScore = (tasks: Task[]) => {
    const earned = tasks.reduce((sum, task) => sum + task.pointsEarned, 0);
    const max = tasks.reduce((sum, task) => sum + task.maxPoints, 0);
    return { earned, max, percentage: max > 0 ? (earned / max) * 100 : 0 };
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subchapter.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.subchapter.chapter.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.subchapter.chapter.course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCourse =
      selectedCourse === "all" ||
      submission.subchapter.chapter.course.title ===
        courses.find((c) => c.id === selectedCourse)?.title;

    const matchesStatus =
      selectedStatus === "all" || submission.status === selectedStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const stats = {
    total: submissions.length,
    approved: submissions.filter((s) => s.status === "APPROVED").length,
    rejected: submissions.filter((s) => s.status === "REJECTED").length,
    pending: submissions.filter(
      (s) =>
        s.status === "PENDING" ||
        s.status === "AI_CHECKED" ||
        s.status === "TEACHER_REVIEWING"
    ).length,
  };

  const openSubmissionDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moje Prace</h1>
        <p className="text-gray-600 mt-1">
          Historia przesłanych prac i ich oceny
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Wszystkie prace
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Zaakceptowane
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.approved}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Odrzucone</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.rejected}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oczekujące</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Szukaj</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Nazwa pliku, lekcja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="course">Kurs</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Wszystkie kursy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kursy</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Wszystkie statusy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="PENDING">Oczekujące</SelectItem>
                <SelectItem value="TEACHER_REVIEWING">
                  W trakcie sprawdzania
                </SelectItem>
                <SelectItem value="APPROVED">Zaakceptowane</SelectItem>
                <SelectItem value="REJECTED">Odrzucone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {submissions.length === 0
                ? "Nie przesłałeś jeszcze żadnej pracy"
                : "Nie znaleziono prac spełniających kryteria"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const statusConfig = getStatusConfig(submission.status);
            const StatusIcon = statusConfig.icon;
            const score = calculateTotalScore(submission.tasks);

            return (
              <Card
                key={submission.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {submission.fileName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BookOpen className="h-3 w-3" />
                            <span>
                              {submission.subchapter.chapter.course.title} →{" "}
                              {submission.subchapter.chapter.title} →{" "}
                              {submission.subchapter.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>

                        <span className="text-sm text-gray-600">
                          Przesłano:{" "}
                          {new Date(submission.submittedAt).toLocaleString(
                            "pl-PL"
                          )}
                        </span>

                        {submission.status === "APPROVED" &&
                          submission.tasks.length > 0 && (
                            <span className="text-sm font-semibold text-green-700">
                              Ocena: {score.earned.toFixed(1)} /{" "}
                              {score.max.toFixed(1)} (
                              {score.percentage.toFixed(0)}%)
                            </span>
                          )}
                      </div>
                    </div>

                    {(submission.status === "APPROVED" ||
                      submission.status === "REJECTED") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSubmissionDetails(submission)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Szczegóły
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedSubmission && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Szczegóły pracy</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Informacje o pliku</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Nazwa:</strong> {selectedSubmission.fileName}
                  </p>
                  <p>
                    <strong>Rozmiar:</strong>{" "}
                    {(selectedSubmission.fileSize / 1024).toFixed(2)} KB
                  </p>
                  <p>
                    <strong>Data przesłania:</strong>{" "}
                    {new Date(selectedSubmission.submittedAt).toLocaleString(
                      "pl-PL"
                    )}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getStatusConfig(selectedSubmission.status).label}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() =>
                    window.open(selectedSubmission.filePath, "_blank")
                  }
                >
                  <Download className="h-4 w-4" />
                  Pobierz plik
                </Button>
              </div>

              {/* Tasks */}
              {selectedSubmission.tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Ocena zadań</h3>
                  <div className="space-y-3">
                    {selectedSubmission.tasks.map((task) => (
                      <div
                        key={task.taskNumber}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">
                            Zadanie {task.taskNumber}
                          </span>
                          <span className="font-bold">
                            {task.pointsEarned} / {task.maxPoints} pkt
                          </span>
                        </div>
                        {task.comment && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-600">
                              <strong>Analiza:</strong>
                            </p>
                            <p className="text-sm">{task.comment}</p>
                          </div>
                        )}
                        {task.teacherComment && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-900">
                              <strong>Komentarz nauczyciela:</strong>
                            </p>
                            <p className="text-sm text-blue-800">
                              {task.teacherComment}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Review */}
              {selectedSubmission.review && (
                <div
                  className={`p-4 rounded-lg ${
                    selectedSubmission.review.approved
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <h3 className="font-semibold mb-2">
                    Ocena nauczyciela:{" "}
                    {selectedSubmission.review.approved
                      ? "Zaakceptowano"
                      : "Odrzucono"}
                  </h3>
                  <p className="text-sm mb-2">
                    <strong>Nauczyciel:</strong>{" "}
                    {selectedSubmission.review.teacher.firstName}{" "}
                    {selectedSubmission.review.teacher.lastName}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>Data sprawdzenia:</strong>{" "}
                    {new Date(
                      selectedSubmission.review.reviewedAt
                    ).toLocaleString("pl-PL")}
                  </p>
                  {selectedSubmission.review.generalComment && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold">Komentarz ogólny:</p>
                      <p className="text-sm mt-1">
                        {selectedSubmission.review.generalComment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
