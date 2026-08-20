"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  Upload,
  CheckSquare,
  FileText,
  Image,
  Trash2,
  AlertCircle,
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
  viewsCount: number;
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

  // Stan dialogu wstawiania pracy domowej
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [homeworkSubchapter, setHomeworkSubchapter] = useState<{
    id: string;
    title: string;
    chapterOrder: number;
    subchapterOrder: number;
  } | null>(null);
  const [uploadMode, setUploadMode] = useState<"pdf" | "images">("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVisibilityData();
  }, [params.studentId, params.courseId]);

  const fetchVisibilityData = async () => {
    try {
      const response = await fetch(
        `/api/teacher/students/${params.studentId}/courses/${params.courseId}/visibility`,
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
    currentEffectiveValue: boolean,
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
    currentEffectiveValue: boolean,
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
    currentEffectiveValue: boolean,
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

  const toggleAllSubchaptersVisibility = (
    chapter: Chapter,
    newValue: boolean,
  ) => {
    setChanges((prev) => {
      const newChanges = { ...prev };

      // Update all subchapters in the chapter
      chapter.subchapters.forEach((subchapter) => {
        const existingChange = newChanges[subchapter.id] || {
          type: "subchapter" as const,
        };
        newChanges[subchapter.id] = {
          ...existingChange,
          type: "subchapter",
          isVisible: newValue,
        };
      });

      return newChanges;
    });
  };

  const getEffectiveVisibility = (
    id: string,
    originalValue: boolean,
  ): boolean => {
    if (changes[id] && changes[id].isVisible !== undefined) {
      return changes[id].isVisible!;
    }
    return originalValue;
  };

  const getEffectiveCanSubmit = (
    id: string,
    originalValue: boolean,
  ): boolean => {
    if (changes[id] && changes[id].canSubmit !== undefined) {
      return changes[id].canSubmit!;
    }
    return originalValue;
  };

  const openHomeworkDialog = (
    subchapterId: string,
    title: string,
    chapterOrder: number,
    subchapterOrder: number,
  ) => {
    setHomeworkSubchapter({
      id: subchapterId,
      title,
      chapterOrder,
      subchapterOrder,
    });
    setUploadMode("pdf");
    setSelectedFile(null);
    setSelectedImages([]);
    setHomeworkDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Błąd",
          description: "Plik jest za duży. Maksymalny rozmiar to 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImagesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 10) {
      toast({
        title: "Błąd",
        description: "Możesz przesłać maksymalnie 10 zdjęć.",
        variant: "destructive",
      });
      return;
    }

    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/"),
    );
    if (invalidFiles.length > 0) {
      toast({
        title: "Błąd",
        description: "Wszystkie pliki muszą być zdjęciami (JPG, PNG).",
        variant: "destructive",
      });
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > 1 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Błąd",
        description: "Każde zdjęcie może mieć maksymalnie 1MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImages(files);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHomeworkSubmit = async () => {
    if (!homeworkSubchapter) return;

    if (uploadMode === "pdf" && !selectedFile) {
      toast({
        title: "Błąd",
        description: "Wybierz plik PDF do przesłania",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === "images" && selectedImages.length === 0) {
      toast({
        title: "Błąd",
        description: "Wybierz przynajmniej jedno zdjęcie",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      if (uploadMode === "pdf") {
        formData.append("file", selectedFile!);
      } else {
        selectedImages.forEach((image) => {
          formData.append("images", image);
        });
      }

      formData.append("subchapterId", homeworkSubchapter.id);
      formData.append("uploadMode", uploadMode);

      const response = await fetch(
        `/api/teacher/students/${params.studentId}/submissions`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      toast({
        title: "Sukces",
        description: "Praca domowa została przesłana za ucznia",
      });

      setHomeworkDialogOpen(false);
      setHomeworkSubchapter(null);
      setSelectedFile(null);
      setSelectedImages([]);
    } catch (error) {
      console.error("Error uploading homework:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać pracy domowej",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
        },
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
              chapter.visibility?.isVisible || false,
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
                    <div className="flex items-center gap-3">
                      {/* Bulk actions for subchapters */}
                      {chapter.subchapters.length > 0 && (
                        <div className="flex items-center gap-2 mr-2 pr-3 border-r">
                          <span className="text-xs text-gray-500">
                            Wszystkie podrozdziały:
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleAllSubchaptersVisibility(chapter, true)
                            }
                            className="h-7 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Pokaż
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleAllSubchaptersVisibility(chapter, false)
                            }
                            className="h-7 text-xs"
                          >
                            <EyeOff className="h-3 w-3 mr-1" />
                            Ukryj
                          </Button>
                        </div>
                      )}
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
                          subchapter.visibility?.isVisible || false,
                        );
                        const canSubmit = getEffectiveCanSubmit(
                          subchapter.id,
                          subchapter.visibility?.canSubmit || false,
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
                                      subchapterVisible,
                                    )
                                  }
                                />
                                <span className="text-sm text-gray-600">
                                  {subchapterVisible ? "Widoczny" : "Ukryty"}
                                </span>
                                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300">
                                  <Eye className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-500">
                                    {subchapter.viewsCount}
                                  </span>
                                </div>
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
                                        canSubmit,
                                      )
                                    }
                                    disabled={!subchapterVisible}
                                  />
                                  <span className="text-sm text-gray-600">
                                    {canSubmit
                                      ? "Wysyłanie włączone"
                                      : "Wysyłanie wyłączone"}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-2 gap-1 text-xs"
                                    onClick={() =>
                                      openHomeworkDialog(
                                        subchapter.id,
                                        subchapter.title,
                                        chapter.order,
                                        subchapter.order,
                                      )
                                    }
                                  >
                                    <Upload className="h-3 w-3" />
                                    Wstaw pracę domową
                                  </Button>
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

      {/* Dialog wstawiania pracy domowej */}
      <Dialog open={homeworkDialogOpen} onOpenChange={setHomeworkDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wstaw pracę domową za ucznia</DialogTitle>
            <DialogDescription>
              {homeworkSubchapter && (
                <>
                  {data?.student.firstName} {data?.student.lastName} &mdash;{" "}
                  {homeworkSubchapter.chapterOrder}.
                  {homeworkSubchapter.subchapterOrder}{" "}
                  {homeworkSubchapter.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Toggle PDF / Zdjęcia */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText
                  className={`h-5 w-5 ${
                    uploadMode === "pdf" ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <span
                  className={`font-medium ${
                    uploadMode === "pdf" ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  Plik PDF
                </span>
              </div>
              <Switch
                checked={uploadMode === "images"}
                onCheckedChange={(checked) => {
                  setUploadMode(checked ? "images" : "pdf");
                  setSelectedFile(null);
                  setSelectedImages([]);
                }}
              />
              <div className="flex items-center gap-3">
                <span
                  className={`font-medium ${
                    uploadMode === "images" ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  Zdjęcia
                </span>
                <Image
                  className={`h-5 w-5 ${
                    uploadMode === "images" ? "text-blue-600" : "text-gray-400"
                  }`}
                />
              </div>
            </div>

            {/* Upload PDF */}
            {uploadMode === "pdf" && (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="teacher-file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf"
                  />
                  <label
                    htmlFor="teacher-file-upload"
                    className="cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">
                      Kliknij, aby wybrać plik PDF
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Maksymalny rozmiar: 10MB
                    </p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Usuń
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Upload zdjęć */}
            {uploadMode === "images" && (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="teacher-images-upload"
                    className="hidden"
                    onChange={handleImagesSelect}
                    accept="image/*"
                    multiple
                  />
                  <label
                    htmlFor="teacher-images-upload"
                    className="cursor-pointer"
                  >
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">
                      Kliknij, aby wybrać zdjęcia
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Maksymalnie 10 zdjęć, każde do 1MB
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Obsługiwane formaty: JPG, PNG
                    </p>
                  </label>
                </div>

                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Wybrane zdjęcia ({selectedImages.length}/10):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedImages.map((image, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <Image className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {image.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {(image.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Info */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Uwaga:</p>
                <p>
                  Wstawiasz pracę domową w imieniu ucznia. Praca zostanie
                  przypisana do tego ucznia.
                </p>
              </div>
            </div>

            {/* Przyciski */}
            <div className="flex gap-3">
              <Button
                onClick={handleHomeworkSubmit}
                disabled={
                  (uploadMode === "pdf" && !selectedFile) ||
                  (uploadMode === "images" && selectedImages.length === 0) ||
                  uploading
                }
                className="flex-1"
              >
                {uploading ? "Przesyłanie..." : "Prześlij pracę"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setHomeworkDialogOpen(false)}
                disabled={uploading}
              >
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
