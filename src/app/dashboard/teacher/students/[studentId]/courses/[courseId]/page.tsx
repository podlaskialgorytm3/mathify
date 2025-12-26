"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  Upload,
} from "lucide-react";

interface Subchapter {
  id: string;
  title: string;
  order: number;
  allowSubmissions: boolean;
  visibility: {
    id: string;
    isVisible: boolean;
    canSubmit: boolean;
    unlockedAt: string | null;
  } | null;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  visibility: {
    id: string;
    isVisible: boolean;
    unlockedAt: string | null;
  } | null;
  subchapters: Subchapter[];
}

interface CourseVisibilityData {
  student: {
    firstName: string;
    lastName: string;
  };
  course: {
    title: string;
    description: string | null;
  };
  chapters: Chapter[];
}

export default function StudentCourseVisibilityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<CourseVisibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<
    Record<
      string,
      {
        type: "chapter" | "subchapter";
        isVisible?: boolean;
        canSubmit?: boolean;
      }
    >
  >({});

  useEffect(() => {
    fetchVisibilityData();
  }, [params.studentId, params.courseId]);

  const fetchVisibilityData = async () => {
    try {
      const response = await fetch(
        `/api/teacher/students/${params.studentId}/courses/${params.courseId}/visibility`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch visibility data");
      }

      setData(result);
      setChanges({});
    } catch (error) {
      console.error("Error fetching visibility:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać danych widoczności",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleChapterVisibility = (
    chapterId: string,
    currentEffectiveValue: boolean
  ) => {
    setChanges((prev) => ({
      ...prev,
      [chapterId]: {
        type: "chapter",
        isVisible: !currentEffectiveValue,
      },
    }));
  };

  const toggleSubchapterVisibility = (
    subchapterId: string,
    currentEffectiveValue: boolean
  ) => {
    setChanges((prev) => {
      const existingChange = prev[subchapterId] || {
        type: "subchapter" as const,
      };
      return {
        ...prev,
        [subchapterId]: {
          ...existingChange,
          type: "subchapter",
          isVisible: !currentEffectiveValue,
        },
      };
    });
  };

  const toggleSubchapterSubmission = (
    subchapterId: string,
    currentEffectiveValue: boolean
  ) => {
    setChanges((prev) => {
      const existingChange = prev[subchapterId] || {
        type: "subchapter" as const,
      };
      return {
        ...prev,
        [subchapterId]: {
          ...existingChange,
          type: "subchapter",
          canSubmit: !currentEffectiveValue,
        },
      };
    });
  };

  const getEffectiveVisibility = (
    id: string,
    originalValue: boolean
  ): boolean => {
    if (changes[id] && changes[id].isVisible !== undefined) {
      return changes[id].isVisible!;
    }
    return originalValue;
  };

  const getEffectiveCanSubmit = (
    id: string,
    originalValue: boolean
  ): boolean => {
    if (changes[id] && changes[id].canSubmit !== undefined) {
      return changes[id].canSubmit!;
    }
    return originalValue;
  };

  const saveChanges = async () => {
    if (Object.keys(changes).length === 0) {
      toast({
        title: "Informacja",
        description: "Brak zmian do zapisania",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/teacher/students/${params.studentId}/courses/${params.courseId}/visibility`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ changes }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save changes");
      }

      toast({
        title: "Sukces",
        description: "Zmiany zostały zapisane",
      });

      // Refresh data
      await fetchVisibilityData();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać zmian",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              router.push(`/dashboard/teacher/students/${params.studentId}`)
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {data.student.firstName} {data.student.lastName}
            </h1>
            <p className="text-gray-500">{data.course.title}</p>
          </div>
        </div>
        <Button
          onClick={saveChanges}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving
            ? "Zapisywanie..."
            : `Zapisz zmiany ${
                hasChanges ? `(${Object.keys(changes).length})` : ""
              }`}
        </Button>
      </div>

      {/* Course Info */}
      {data.course.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">{data.course.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Chapters and Subchapters */}
      <div className="space-y-4">
        {data.chapters.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 py-8">
                Ten kurs nie ma jeszcze żadnych rozdziałów
              </p>
            </CardContent>
          </Card>
        ) : (
          data.chapters.map((chapter) => {
            const chapterVisible = getEffectiveVisibility(
              chapter.id,
              chapter.visibility?.isVisible || false
            );

            return (
              <Card key={chapter.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      <span>
                        {chapter.order}. {chapter.title}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {chapterVisible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <Switch
                        checked={chapterVisible}
                        onCheckedChange={() =>
                          toggleChapterVisibility(chapter.id, chapterVisible)
                        }
                      />
                      <span className="text-sm font-normal text-gray-600">
                        {chapterVisible ? "Widoczny" : "Ukryty"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {chapter.subchapters.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Brak podrozdziałów
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {chapter.subchapters.map((subchapter) => {
                        const subchapterVisible = getEffectiveVisibility(
                          subchapter.id,
                          subchapter.visibility?.isVisible || false
                        );
                        const canSubmit = getEffectiveCanSubmit(
                          subchapter.id,
                          subchapter.visibility?.canSubmit || false
                        );

                        return (
                          <div
                            key={subchapter.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {chapter.order}.{subchapter.order}{" "}
                                {subchapter.title}
                              </span>
                              {subchapter.allowSubmissions && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  Praca domowa
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Widoczność */}
                              <div className="flex items-center gap-2">
                                {subchapterVisible ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                                <Switch
                                  checked={subchapterVisible}
                                  onCheckedChange={() =>
                                    toggleSubchapterVisibility(
                                      subchapter.id,
                                      subchapterVisible
                                    )
                                  }
                                />
                                <span className="text-sm text-gray-600">
                                  {subchapterVisible ? "Widoczny" : "Ukryty"}
                                </span>
                              </div>

                              {/* Możliwość wysyłania pracy */}
                              {subchapter.allowSubmissions && (
                                <div className="flex items-center gap-2 pl-4 border-l">
                                  {canSubmit ? (
                                    <Upload className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Upload className="h-4 w-4 text-gray-400" />
                                  )}
                                  <Switch
                                    checked={canSubmit}
                                    onCheckedChange={() =>
                                      toggleSubchapterSubmission(
                                        subchapter.id,
                                        canSubmit
                                      )
                                    }
                                    disabled={!subchapterVisible}
                                  />
                                  <span className="text-sm text-gray-600">
                                    {canSubmit
                                      ? "Wysyłanie włączone"
                                      : "Wysyłanie wyłączone"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
