"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Lock,
  CheckCircle,
  FileText,
  Upload,
  LockOpen,
  Trash2,
  Download,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: string;
  content: string;
}

interface SubmissionInfo {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  submittedAt: string;
}

interface Subchapter {
  id: string;
  title: string;
  order: number;
  description: string | null;
  allowSubmissions: boolean;
  isVisible: boolean;
  canSubmit: boolean;
  materials: Material[];
  submission?: SubmissionInfo | null;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  description: string | null;
  isVisible: boolean;
  subchapters: Subchapter[];
}

interface CourseDetails {
  id: string;
  title: string;
  description: string | null;
  teacher: {
    firstName: string;
    lastName: string;
  };
  chapters: Chapter[];
}

export default function StudentCourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<
    Record<string, SubmissionInfo | null>
  >({});
  const [deletingSubmission, setDeletingSubmission] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchCourseDetails();
  }, [params.courseId]);

  useEffect(() => {
    if (course) {
      fetchSubmissions();
    }
  }, [course]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`/api/student/courses/${params.courseId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch course");
      }

      setCourse(data);
    } catch (error) {
      console.error("Error fetching course:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać kursu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!course) return;

    const subchapterIds: string[] = [];
    course.chapters.forEach((chapter) => {
      chapter.subchapters.forEach((subchapter) => {
        if (subchapter.allowSubmissions) {
          subchapterIds.push(subchapter.id);
        }
      });
    });

    // Pobierz submissions dla wszystkich podrozdziałów z pracą domową
    const submissionsData: Record<string, SubmissionInfo | null> = {};

    await Promise.all(
      subchapterIds.map(async (subchapterId) => {
        try {
          const response = await fetch(
            `/api/student/submissions/subchapter/${subchapterId}`
          );
          const data = await response.json();
          submissionsData[subchapterId] = data.submission;
        } catch (error) {
          console.error(
            `Error fetching submission for ${subchapterId}:`,
            error
          );
          submissionsData[subchapterId] = null;
        }
      })
    );

    setSubmissions(submissionsData);
  };

  const deleteSubmission = async (subchapterId: string) => {
    const submission = submissions[subchapterId];
    if (!submission) {
      return;
    }

    if (
      !confirm(
        "Czy na pewno chcesz usunąć przesłaną pracę? Tej operacji nie można cofnąć."
      )
    ) {
      return;
    }

    setDeletingSubmission(subchapterId);

    try {
      const response = await fetch(
        `/api/student/submissions?id=${submission.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete submission");
      }

      toast({
        title: "Sukces",
        description: "Praca domowa została usunięta",
      });

      // Odśwież submissions
      await fetchSubmissions();
    } catch (error: any) {
      console.error("Error deleting submission:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć pracy domowej",
        variant: "destructive",
      });
    } finally {
      setDeletingSubmission(null);
    }
  };

  const openMaterial = (material: Material) => {
    if (material.type === "LINK") {
      window.open(material.content, "_blank");
    } else if (material.type === "PDF") {
      window.open(material.content, "_blank");
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

  if (!course) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nie znaleziono kursu</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/student/courses")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-500">
            Nauczyciel: {course.teacher.firstName} {course.teacher.lastName}
          </p>
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">{course.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Chapters */}
      <div className="space-y-4">
        {course.chapters.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 py-8">
                Brak dostępnych rozdziałów
              </p>
            </CardContent>
          </Card>
        ) : (
          course.chapters.map((chapter) => (
            <Card key={chapter.id} className="overflow-hidden">
              <CardHeader
                className={`${
                  chapter.isVisible ? "bg-blue-50" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {chapter.isVisible ? (
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                    <span>
                      {chapter.order}. {chapter.title}
                    </span>
                  </CardTitle>
                  {!chapter.isVisible && (
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Zablokowany
                    </span>
                  )}
                </div>
                {chapter.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {chapter.description}
                  </p>
                )}
              </CardHeader>

              {chapter.isVisible && (
                <CardContent className="pt-4">
                  {chapter.subchapters.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Brak podrozdziałów
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {chapter.subchapters.map((subchapter) => (
                        <div
                          key={subchapter.id}
                          className={`p-4 rounded-lg border-2 ${
                            subchapter.isVisible
                              ? "border-blue-200 bg-white hover:bg-blue-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {subchapter.isVisible ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <Lock className="h-5 w-5 text-gray-400" />
                              )}
                              <span className="font-semibold">
                                {chapter.order}.{subchapter.order}{" "}
                                {subchapter.title}
                              </span>
                            </div>
                            {!subchapter.isVisible && (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                Zablokowany
                              </span>
                            )}
                          </div>

                          {subchapter.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {subchapter.description}
                            </p>
                          )}

                          {subchapter.isVisible && (
                            <>
                              {/* Materials */}
                              {subchapter.materials.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <h4 className="text-sm font-semibold text-gray-700">
                                    Materiały:
                                  </h4>
                                  {subchapter.materials.map((material) => (
                                    <button
                                      key={material.id}
                                      onClick={() => openMaterial(material)}
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      <FileText className="h-4 w-4" />
                                      {material.title}
                                      {material.type === "PDF" && (
                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                          PDF
                                        </span>
                                      )}
                                      {material.type === "LINK" && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                          Link
                                        </span>
                                      )}
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Submissions */}
                              {subchapter.allowSubmissions && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  {submissions[subchapter.id] ? (
                                    // Praca już przesłana - pokaż informacje o pliku
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-start gap-3 flex-1">
                                          <FileText className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">
                                              Praca przesłana
                                            </p>
                                            <p className="text-sm text-gray-600 truncate">
                                              {
                                                submissions[subchapter.id]!
                                                  .fileName
                                              }
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(
                                                submissions[
                                                  subchapter.id
                                                ]!.submittedAt
                                              ).toLocaleDateString("pl-PL", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              Status:{" "}
                                              {submissions[subchapter.id]!
                                                .status === "PENDING" ||
                                              submissions[subchapter.id]!
                                                .status === "AI_CHECKED"
                                                ? "Oczekuje na sprawdzenie"
                                                : submissions[subchapter.id]!
                                                    .status ===
                                                  "TEACHER_REVIEWING"
                                                ? "W trakcie sprawdzania"
                                                : submissions[subchapter.id]!
                                                    .status === "APPROVED"
                                                ? "Zaakceptowana"
                                                : "Odrzucona"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 ml-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                submissions[subchapter.id]!
                                                  .filePath,
                                                "_blank"
                                              )
                                            }
                                            className="gap-2"
                                          >
                                            <Download className="h-4 w-4" />
                                            Pobierz
                                          </Button>
                                          {(submissions[subchapter.id]!
                                            .status === "PENDING" ||
                                            submissions[subchapter.id]!
                                              .status === "AI_CHECKED" ||
                                            submissions[subchapter.id]!
                                              .status === "REJECTED") && (
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() =>
                                                deleteSubmission(subchapter.id)
                                              }
                                              disabled={
                                                deletingSubmission ===
                                                subchapter.id
                                              }
                                              className="gap-2"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                              {deletingSubmission ===
                                              subchapter.id
                                                ? "Usuwanie..."
                                                : "Usuń"}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      {(submissions[subchapter.id]!.status ===
                                        "PENDING" ||
                                        submissions[subchapter.id]!.status ===
                                          "REJECTED") && (
                                        <p className="text-xs text-gray-500 italic">
                                          Możesz usunąć tę pracę i przesłać nową
                                        </p>
                                      )}
                                    </div>
                                  ) : subchapter.canSubmit ? (
                                    // Brak pracy - pokaż przycisk przesyłania
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/student/courses/${params.courseId}/subchapters/${subchapter.id}/submit`
                                        )
                                      }
                                      className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                    >
                                      <Upload className="h-4 w-4" />
                                      Prześlij pracę domową
                                    </Button>
                                  ) : (
                                    // Przesyłanie zablokowane
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Lock className="h-4 w-4" />
                                      Przesyłanie prac domowych jest obecnie
                                      zablokowane
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
