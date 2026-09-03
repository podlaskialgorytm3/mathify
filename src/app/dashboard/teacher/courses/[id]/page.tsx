"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import FileUpload from "@/components/FileUpload";
import { CopySubchapterDialog } from "@/components/course-management/copy-subchapter-dialog";
import { CopyMaterialDialog } from "@/components/course-management/copy-material-dialog";
import { LatexEditorModal } from "@/components/latex-editor/latex-editor-modal";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  Download,
  Link as LinkIcon,
  X,
  UserPlus,
  Search,
  CheckSquare,
  Square,
  Copy,
  HardDrive,
  FileCode,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: "PDF" | "LINK";
  content: string;
  source?: "COURSE" | "HOMEWORK";
  latexDocument?: { id: string } | null;
}

interface MaterialSubchapterEntry {
  id: string;
  materialId: string;
  order: number;
  material: Material;
}

interface Subchapter {
  id: string;
  title: string;
  description: string | null;
  order: number;
  visibilityType: string;
  visibleFromDate: Date | null;
  visibleUntilDate: Date | null;
  requiresPrevious: boolean;
  allowSubmissions: boolean;
  materialSubchapters: MaterialSubchapterEntry[];
  _count: {
    materialSubchapters: number;
    submissions: number;
  };
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  order: number;
  visibilityType: string;
  visibleFromDate: Date | null;
  visibleUntilDate: Date | null;
  requiresPrevious: boolean;
  subchapters: Subchapter[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  aiPromptTemplate?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  computedAccessType?: string;
  chapters: Chapter[];
  _count: {
    enrollments: number;
  };
}

interface AIPromptTemplate {
  id: string;
  name: string;
  description: string | null;
}

export default function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showSubchapterModal, setShowSubchapterModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingSubchapter, setEditingSubchapter] = useState<{
    chapter: Chapter;
    subchapter: Subchapter;
  } | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<{
    subchapterId: string;
    material: Material | null;
  } | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<
    string | null
  >(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [aiTemplates, setAiTemplates] = useState<AIPromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [showCopySubchapterDialog, setShowCopySubchapterDialog] = useState(false);
  const [showCopyMaterialDialog, setShowCopyMaterialDialog] = useState(false);
  const [copyTargetSubchapterId, setCopyTargetSubchapterId] = useState<string | null>(null);
  const [latexEditorDocumentId, setLatexEditorDocumentId] = useState<string | null>(null);
  const [latexEditorSubchapterId, setLatexEditorSubchapterId] = useState<string | null>(null);
  const { toast } = useToast();

  const canEdit = course?.computedAccessType === 'OWNER' || course?.computedAccessType === 'OPEN_SOURCE';

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/courses/${courseId}`);
      const data = await response.json();

      if (response.ok) {
        setCourse(data.course);
        setSelectedTemplateId(data.course.aiPromptTemplate?.id || "");
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać kursu",
          variant: "destructive",
        });
        router.push("/dashboard/teacher/courses");
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania kursu",
        variant: "destructive",
      });
      router.push("/dashboard/teacher/courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchAITemplates = async () => {
    try {
      const response = await fetch("/api/teacher/ai-prompts");
      const data = await response.json();

      if (response.ok) {
        setAiTemplates(data.templates || []);
      } else {
        setAiTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching AI templates:", error);
      setAiTemplates([]);
    }
  };

  const updateAITemplate = async (templateId: string) => {
    try {
      setUpdatingTemplate(true);
      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiPromptTemplateId: templateId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: "Szablon AI został zaktualizowany",
        });
        setSelectedTemplateId(templateId);
        fetchCourse();
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
        description: "Wystąpił błąd podczas aktualizacji szablonu",
        variant: "destructive",
      });
    } finally {
      setUpdatingTemplate(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchAITemplates();
  }, [courseId]);

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const createChapter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(
        `/api/teacher/courses/${courseId}/chapters`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.get("title"),
            description: formData.get("description"),
            visibilityType: formData.get("visibilityType"),
            visibleFromDate: formData.get("visibleFromDate") || null,
            visibleUntilDate: formData.get("visibleUntilDate") || null,
            requiresPrevious: formData.get("requiresPrevious") === "on",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setShowChapterModal(false);
        fetchCourse();
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
        description: "Wystąpił błąd podczas tworzenia rozdziału",
        variant: "destructive",
      });
    }
  };

  const updateChapter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingChapter) return;

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(
        `/api/teacher/courses/${courseId}/chapters/${editingChapter.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.get("title"),
            description: formData.get("description"),
            visibilityType: formData.get("visibilityType"),
            visibleFromDate: formData.get("visibleFromDate") || null,
            visibleUntilDate: formData.get("visibleUntilDate") || null,
            requiresPrevious: formData.get("requiresPrevious") === "on",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setEditingChapter(null);
        fetchCourse();
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
        description: "Wystąpił błąd podczas aktualizacji rozdziału",
        variant: "destructive",
      });
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć ten rozdział? Wszystkie podrozdziały zostaną usunięte."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher/courses/${courseId}/chapters/${chapterId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        fetchCourse();
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
        description: "Wystąpił błąd podczas usuwania rozdziału",
        variant: "destructive",
      });
    }
  };

  const createSubchapter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedChapterId) return;

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(
        `/api/teacher/chapters/${selectedChapterId}/subchapters`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.get("title"),
            description: formData.get("description"),
            visibilityType: formData.get("visibilityType"),
            visibleFromDate: formData.get("visibleFromDate") || null,
            visibleUntilDate: formData.get("visibleUntilDate") || null,
            requiresPrevious: formData.get("requiresPrevious") === "on",
            allowSubmissions: formData.get("allowSubmissions") === "on",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setShowSubchapterModal(false);
        setSelectedChapterId(null);
        fetchCourse();
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
        description: "Wystąpił błąd podczas tworzenia podrozdziału",
        variant: "destructive",
      });
    }
  };

  const updateSubchapter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSubchapter) return;

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(
        `/api/teacher/chapters/${editingSubchapter.chapter.id}/subchapters/${editingSubchapter.subchapter.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.get("title"),
            description: formData.get("description"),
            visibilityType: formData.get("visibilityType"),
            visibleFromDate: formData.get("visibleFromDate") || null,
            visibleUntilDate: formData.get("visibleUntilDate") || null,
            requiresPrevious: formData.get("requiresPrevious") === "on",
            allowSubmissions: formData.get("allowSubmissions") === "on",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setEditingSubchapter(null);
        fetchCourse();
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
        description: "Wystąpił błąd podczas aktualizacji podrozdziału",
        variant: "destructive",
      });
    }
  };

  const deleteSubchapter = async (chapterId: string, subchapterId: string) => {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć ten podrozdział? Wszystkie materiały zostaną usunięte."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher/chapters/${chapterId}/subchapters/${subchapterId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        fetchCourse();
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
        description: "Wystąpił błąd podczas usuwania podrozdziału",
        variant: "destructive",
      });
    }
  };

  const uploadMaterial = async (data: {
    title: string;
    description: string;
    type: "PDF" | "LINK";
    content: string;
    existingMaterialId?: string;
    hashCode?: string;
  }) => {
    if (!selectedSubchapterId) return;

    try {
      setUploadingFile(true);
      const response = await fetch(
        `/api/teacher/subchapters/${selectedSubchapterId}/materials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: responseData.message,
        });
        setShowMaterialModal(false);
        setSelectedSubchapterId(null);
        fetchCourse();
      } else {
        toast({
          title: "Błąd",
          description: responseData.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas przesyłania materiału",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const updateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMaterial?.material) return;

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(
        `/api/teacher/materials/${editingMaterial.material.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.get("title"),
            description: formData.get("description"),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setEditingMaterial(null);
        fetchCourse();
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
        description: "Wystąpił błąd podczas aktualizacji materiału",
        variant: "destructive",
      });
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten materiał?")) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/materials/${materialId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        fetchCourse();
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
        description: "Wystąpił błąd podczas usuwania materiału",
        variant: "destructive",
      });
    }
  };

  const bulkDeleteMaterials = async () => {
    if (selectedMaterials.size === 0) {
      toast({
        title: "Błąd",
        description: "Nie wybrano żadnych materiałów",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `Czy na pewno chcesz usunąć ${selectedMaterials.size} materiałów?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/teacher/materials/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialIds: Array.from(selectedMaterials) }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setSelectedMaterials(new Set());
        setSelectionMode(false);
        fetchCourse();
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
        description: "Wystąpił błąd podczas usuwania materiałów",
        variant: "destructive",
      });
    }
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  };

  const toggleSelectAllMaterials = (materials: Material[]) => {
    const materialIds = materials.map((m) => m.id);
    const allSelected = materialIds.every((id) => selectedMaterials.has(id));

    if (allSelected) {
      setSelectedMaterials((prev) => {
        const newSet = new Set(prev);
        materialIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedMaterials((prev) => {
        const newSet = new Set(prev);
        materialIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const searchStudents = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `/api/teacher/students/search?query=${encodeURIComponent(
          query
        )}&courseId=${courseId}`
      );
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.students);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się wyszukać uczniów",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas wyszukiwania uczniów",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const enrollStudent = async (studentId: string) => {
    try {
      setEnrolling(true);
      const response = await fetch(`/api/teacher/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setShowEnrollModal(false);
        setSearchQuery("");
        setSearchResults([]);
        fetchCourse();
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
        description: "Wystąpił błąd podczas zapisywania ucznia",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const getVisibilityIcon = (visibilityType: string) => {
    switch (visibilityType) {
      case "MANUAL":
        return <Eye className="w-4 h-4" />;
      case "DATE_BASED":
        return <Calendar className="w-4 h-4" />;
      case "PROGRESS_BASED":
        return <Lock className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  if (!course) {
    return <div className="text-center py-12">Nie znaleziono kursu</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => router.push("/dashboard/teacher/courses")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl break-words">
              {course.title}
            </h1>
            <p className="text-gray-600 mt-1">
              {course.description || "Brak opisu"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {course._count.enrollments} zapisanych uczniów
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setShowEnrollModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Dodaj ucznia
          </Button>
          {canEdit && (
            <Button
              className="w-full sm:w-auto"
              onClick={() => setShowChapterModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nowy Rozdział
            </Button>
          )}
        </div>
      </div>

      {/* AI Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Szablon Zapytania AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="ai-template">
                Wybierz szablon do sprawdzania prac domowych
              </Label>
              <select
                id="ai-template"
                value={selectedTemplateId}
                onChange={(e) => updateAITemplate(e.target.value)}
                disabled={!canEdit || updatingTemplate}
                className="w-full p-2 border rounded-md mt-1"
              >
                <option value="">Brak szablonu</option>
                {(aiTemplates || []).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.description && ` - ${template.description}`}
                  </option>
                ))}
              </select>
              {course.aiPromptTemplate && (
                <p className="text-sm text-green-600 mt-2">
                  Aktualnie używany: {course.aiPromptTemplate.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters List */}
      {(course.chapters || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Brak rozdziałów w tym kursie</p>
            {canEdit && (
              <Button onClick={() => setShowChapterModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pierwszy rozdział
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(course.chapters || []).map((chapter) => (
            <Card key={chapter.id} className="overflow-hidden">
              <div
                className="flex flex-col gap-3 p-4 cursor-pointer hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-500">
                        {chapter.order}.
                      </span>
                      <h3 className="font-semibold">{chapter.title}</h3>
                      {getVisibilityIcon(chapter.visibilityType)}
                      {chapter.requiresPrevious && (
                        <Lock
                          className="w-4 h-4 text-orange-500"
                          aria-label="Wymaga ukończenia poprzedniego"
                        />
                      )}
                    </div>
                    {chapter.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {chapter.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {chapter.subchapters?.length || 0} podrozdziałów
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <div
                    className="flex flex-wrap items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedChapterId(chapter.id);
                        setShowSubchapterModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Podrozdział
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingChapter(chapter)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteChapter(chapter.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Subchapters */}
              {expandedChapters.has(chapter.id) && (
                <div className="border-t bg-gray-50 p-4">
                  {!chapter.subchapters || chapter.subchapters.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-3">Brak podrozdziałów</p>
                      {canEdit && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedChapterId(chapter.id);
                            setShowSubchapterModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Dodaj podrozdział
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chapter.subchapters.map((subchapter) => (
                        <div
                          key={subchapter.id}
                          className="bg-white rounded-lg border"
                        >
                          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">
                                  {chapter.order}.{subchapter.order}
                                </span>
                                <h4 className="font-medium">
                                  {subchapter.title}
                                </h4>
                                {getVisibilityIcon(subchapter.visibilityType)}
                                {subchapter.requiresPrevious && (
                                  <Lock className="w-4 h-4 text-orange-500" />
                                )}
                                {subchapter.allowSubmissions && (
                                  <Upload
                                    className="w-4 h-4 text-blue-500"
                                    aria-label="Przyjmuje rozwiązania"
                                  />
                                )}
                              </div>
                              {subchapter.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {subchapter.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {subchapter._count.materialSubchapters} materiałów •{" "}
                                {subchapter._count.submissions} rozwiązań
                              </p>
                            </div>
                            {canEdit && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSubchapterId(subchapter.id);
                                    setShowMaterialModal(true);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Materiał
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Stwórz własny materiał PDF z edytora LaTeX"
                                  onClick={async () => {
                                    // Create a new LatexDocument for this subchapter
                                    const res = await fetch("/api/teacher/latex-documents", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ title: "Nowy dokument LaTeX", sourceCode: "" }),
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setLatexEditorSubchapterId(subchapter.id);
                                      setLatexEditorDocumentId(data.document.id);
                                    } else {
                                      toast({ title: "Błąd", description: "Nie udało się utworzyć dokumentu LaTeX", variant: "destructive" });
                                    }
                                  }}
                                >
                                  <FileCode className="w-4 h-4 mr-1" />
                                  Stwórz własne
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Dodaj istniejący materiał z Dysku"
                                  onClick={() => {
                                    setCopyTargetSubchapterId(subchapter.id);
                                    setShowCopyMaterialDialog(true);
                                  }}
                                >
                                  <HardDrive className="w-4 h-4 mr-1" />
                                  Z Dysku
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Skopiuj materiały z innego podrozdziału"
                                  onClick={() => {
                                    setCopyTargetSubchapterId(subchapter.id);
                                    setShowCopySubchapterDialog(true);
                                  }}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Kopiuj
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setEditingSubchapter({ chapter, subchapter })
                                  }
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    deleteSubchapter(chapter.id, subchapter.id)
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Materials List */}
                          {subchapter.materialSubchapters &&
                            subchapter.materialSubchapters.length > 0 && (
                              <div className="border-t px-3 py-2 bg-gray-50">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <p className="text-xs font-semibold text-gray-600">
                                    Materiały:
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {canEdit && (
                                      <>
                                        {!selectionMode ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectionMode(true)}
                                            className="text-xs h-7"
                                          >
                                            <CheckSquare className="w-3 h-3 mr-1" />
                                            Zaznacz
                                          </Button>
                                        ) : (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                toggleSelectAllMaterials(
                                                  subchapter.materialSubchapters.map(ms => ms.material)
                                                )
                                              }
                                              className="text-xs h-7"
                                            >
                                              {subchapter.materialSubchapters.every((ms) =>
                                                selectedMaterials.has(ms.material.id)
                                              )
                                                ? "Odznacz wszystkie"
                                                : "Zaznacz wszystkie"}
                                            </Button>
                                            {selectedMaterials.size > 0 && (
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={bulkDeleteMaterials}
                                                className="text-xs h-7"
                                              >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Usuń ({selectedMaterials.size})
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setSelectionMode(false);
                                                setSelectedMaterials(new Set());
                                              }}
                                              className="text-xs h-7"
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {subchapter.materialSubchapters.map(({ material }) => (
                                    <div
                                      key={material.id}
                                      className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded border text-sm"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {selectionMode && (
                                          <button
                                            onClick={() =>
                                              toggleMaterialSelection(
                                                material.id
                                              )
                                            }
                                            className="flex-shrink-0"
                                          >
                                            {selectedMaterials.has(
                                              material.id
                                            ) ? (
                                              <CheckSquare className="w-4 h-4 text-blue-500" />
                                            ) : (
                                              <Square className="w-4 h-4 text-gray-400" />
                                            )}
                                          </button>
                                        )}
                                        {material.type === "PDF" ? (
                                          <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        ) : (
                                          <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">
                                            {material.title}
                                          </p>
                                          {material.description && (
                                            <p className="text-xs text-gray-500 truncate">
                                              {material.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {!selectionMode && (
                                        <div className="flex items-center gap-1 ml-2">
                                          {material.type === "PDF" ? (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                window.open(
                                                  material.content,
                                                  "_blank"
                                                )
                                              }
                                            >
                                              <Download className="w-3 h-3" />
                                            </Button>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                window.open(
                                                  material.content,
                                                  "_blank"
                                                )
                                              }
                                            >
                                              <LinkIcon className="w-3 h-3" />
                                            </Button>
                                          )}
                                          {canEdit && (
                                            <>
                                              {material.latexDocument ? (
                                                // LaTeX material — open in LaTeX editor
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  title="Edytuj w edytorze LaTeX"
                                                  onClick={() => {
                                                    setLatexEditorSubchapterId(subchapter.id);
                                                    setLatexEditorDocumentId(material.latexDocument!.id);
                                                  }}
                                                >
                                                  <FileCode className="w-3 h-3 text-blue-500" />
                                                </Button>
                                              ) : (
                                                // Classic material — open classic edit modal
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() =>
                                                    setEditingMaterial({
                                                      subchapterId: subchapter.id,
                                                      material,
                                                    })
                                                  }
                                                >
                                                  <Pencil className="w-3 h-3" />
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                  deleteMaterial(material.id)
                                                }
                                              >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Chapter Modal */}
      {showChapterModal && (
        <ChapterModal
          onClose={() => setShowChapterModal(false)}
          onSubmit={createChapter}
          title="Utwórz Nowy Rozdział"
        />
      )}

      {/* Edit Chapter Modal */}
      {editingChapter && (
        <ChapterModal
          onClose={() => setEditingChapter(null)}
          onSubmit={updateChapter}
          title="Edytuj Rozdział"
          defaultValues={editingChapter}
        />
      )}

      {/* Create Subchapter Modal */}
      {showSubchapterModal && (
        <SubchapterModal
          onClose={() => {
            setShowSubchapterModal(false);
            setSelectedChapterId(null);
          }}
          onSubmit={createSubchapter}
          title="Utwórz Nowy Podrozdział"
        />
      )}

      {/* Edit Subchapter Modal */}
      {editingSubchapter && (
        <SubchapterModal
          onClose={() => setEditingSubchapter(null)}
          onSubmit={updateSubchapter}
          title="Edytuj Podrozdział"
          defaultValues={editingSubchapter.subchapter}
        />
      )}

      {/* Upload Material Modal */}
      {showMaterialModal && (
        <MaterialModal
          onClose={() => {
            setShowMaterialModal(false);
            setSelectedSubchapterId(null);
          }}
          onSubmit={uploadMaterial}
          title="Dodaj Materiał"
          uploading={uploadingFile}
        />
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <EditMaterialModal
          onClose={() => setEditingMaterial(null)}
          onSubmit={updateMaterial}
          defaultValues={editingMaterial.material}
        />
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <EnrollStudentModal
          onClose={() => {
            setShowEnrollModal(false);
            setSearchQuery("");
            setSearchResults([]);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          enrolling={enrolling}
          onSearch={searchStudents}
          onEnroll={enrollStudent}
        />
      )}

      {/* Copy Subchapter Dialog */}
      {showCopySubchapterDialog && copyTargetSubchapterId && (
        <CopySubchapterDialog
          targetSubchapterId={copyTargetSubchapterId}
          onClose={() => {
            setShowCopySubchapterDialog(false);
            setCopyTargetSubchapterId(null);
            fetchCourse();
          }}
        />
      )}

      {/* Copy Material from Disk Dialog */}
      {showCopyMaterialDialog && copyTargetSubchapterId && (
        <CopyMaterialDialog
          targetSubchapterId={copyTargetSubchapterId}
          onClose={() => {
            setShowCopyMaterialDialog(false);
            setCopyTargetSubchapterId(null);
            fetchCourse();
          }}
        />
      )}

      {/* LaTeX Editor Modal */}
      {latexEditorDocumentId && (
        <LatexEditorModal
          documentId={latexEditorDocumentId}
          subchapterId={latexEditorSubchapterId ?? undefined}
          onClose={() => {
            setLatexEditorDocumentId(null);
            setLatexEditorSubchapterId(null);
          }}
          onPublished={() => {
            setLatexEditorDocumentId(null);
            setLatexEditorSubchapterId(null);
            fetchCourse();
          }}
        />
      )}
    </div>
  );
}

// Chapter Modal Component
function ChapterModal({
  onClose,
  onSubmit,
  title,
  defaultValues,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  defaultValues?: any;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-touch">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Tytuł rozdziału *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={defaultValues?.title}
                placeholder="np. Funkcje liniowe"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Opis</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={defaultValues?.description || ""}
                className="w-full p-2 border rounded-md min-h-[80px]"
                placeholder="Opis rozdziału..."
              />
            </div>
            <div>
              <Label htmlFor="visibilityType">Typ widoczności</Label>
              <select
                id="visibilityType"
                name="visibilityType"
                defaultValue={defaultValues?.visibilityType || "MANUAL"}
                className="w-full p-2 border rounded-md"
              >
                <option value="MANUAL">Ręczna</option>
                <option value="DATE_BASED">Bazująca na dacie</option>
                <option value="PROGRESS_BASED">Bazująca na postępie</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="visibleFromDate">Widoczny od</Label>
                <Input
                  id="visibleFromDate"
                  name="visibleFromDate"
                  type="datetime-local"
                  defaultValue={
                    defaultValues?.visibleFromDate
                      ? new Date(defaultValues.visibleFromDate)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                />
              </div>
              <div>
                <Label htmlFor="visibleUntilDate">Widoczny do</Label>
                <Input
                  id="visibleUntilDate"
                  name="visibleUntilDate"
                  type="datetime-local"
                  defaultValue={
                    defaultValues?.visibleUntilDate
                      ? new Date(defaultValues.visibleUntilDate)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresPrevious"
                name="requiresPrevious"
                defaultChecked={defaultValues?.requiresPrevious}
                className="w-4 h-4"
              />
              <Label htmlFor="requiresPrevious" className="cursor-pointer">
                Wymaga ukończenia poprzedniego rozdziału
              </Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit">Zapisz</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Material Upload Modal Component
function MaterialModal({
  onClose,
  onSubmit,
  title,
  uploading,
}: {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    type: "PDF" | "LINK";
    content: string;
    existingMaterialId?: string;
    hashCode?: string;
  }) => void;
  title: string;
  uploading: boolean;
}) {
  const [uploadMode, setUploadMode] = useState<"quick" | "normal">("quick");
  const [materialType, setMaterialType] = useState<"PDF" | "LINK">("PDF");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [existingMaterialId, setExistingMaterialId] = useState<string | undefined>();
  const [hashCode, setHashCode] = useState<string | undefined>();
  const [quickFiles, setQuickFiles] = useState<
    Array<{ file: File; url: string; uploading: boolean; existingMaterialId?: string; hashCode?: string; title?: string }>
  >([]);

  const handleQuickFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Limit to 4 files
    const filesToUpload = files.slice(0, 4);

    if (files.length > 4) {
      alert("Możesz dodać maksymalnie 4 pliki naraz");
    }

    // Validate PDF files
    const invalidFiles = filesToUpload.filter(
      (file) => !file.name.toLowerCase().endsWith(".pdf")
    );

    if (invalidFiles.length > 0) {
      alert("Wszystkie pliki muszą być w formacie PDF");
      return;
    }

    // Add files to state
    const newFiles = filesToUpload.map((file) => ({
      file,
      url: "",
      uploading: true,
    }));

    setQuickFiles((prev) => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        let response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        let data = await response.json();

        if (response.status === 409 && data.isDuplicate) {
          const useReference = window.confirm(
            `Plik "${file.name}" istnieje w bazie danych.\nCzy zamiast tego chcesz wstawić referencję do istniejącego pliku?\n\n[OK] - Wstaw referencję\n[Anuluj] - Wstaw duplikat`
          );

          if (useReference) {
            setQuickFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      url: data.existingMaterial.content,
                      existingMaterialId: data.existingMaterial.id,
                      hashCode: data.existingMaterial.hashCode,
                      title: data.existingMaterial.title,
                      uploading: false,
                    }
                  : f
              )
            );
            continue;
          } else {
            formData.append("forceDuplicate", "true");
            response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            data = await response.json();
          }
        }

        if (response.ok) {
          setQuickFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, url: data.url, hashCode: data.hashCode, uploading: false } : f
            )
          );
        } else {
          alert(`Błąd uploadu pliku ${file.name}: ${data.error}`);
          setQuickFiles((prev) => prev.filter((f) => f.file !== file));
        }
      } catch (error) {
        alert(`Błąd uploadu pliku ${file.name}`);
        setQuickFiles((prev) => prev.filter((f) => f.file !== file));
      }
    }
  };

  const handleQuickSubmit = async () => {
    const readyFiles = quickFiles.filter((f) => !f.uploading && f.url);

    if (readyFiles.length === 0) {
      alert("Brak plików do dodania");
      return;
    }

    // Submit each file as a separate material
    for (const fileData of readyFiles) {
      const fileName = fileData.title || fileData.file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      await onSubmit({
        title: fileName,
        description: "",
        type: "PDF",
        content: fileData.url,
        existingMaterialId: fileData.existingMaterialId,
        hashCode: fileData.hashCode,
      });
    }
  };

  const handleNormalSubmit = () => {
    if (!materialTitle) {
      alert("Tytuł jest wymagany");
      return;
    }

    if (materialType === "PDF" && !uploadedFileUrl) {
      alert("Proszę najpierw uploadować plik");
      return;
    }

    if (materialType === "LINK" && !materialUrl) {
      alert("URL jest wymagany");
      return;
    }

    onSubmit({
      title: materialTitle,
      description: materialDescription,
      type: materialType,
      content: materialType === "PDF" ? uploadedFileUrl : materialUrl,
      existingMaterialId: materialType === "PDF" ? existingMaterialId : undefined,
      hashCode: materialType === "PDF" ? hashCode : undefined,
    });
  };

  const removeQuickFile = (fileToRemove: File) => {
    setQuickFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mode Selection */}
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={uploadMode === "quick" ? "default" : "outline"}
              onClick={() => setUploadMode("quick")}
              className="flex-1"
              disabled={uploading}
            >
              Dodawanie szybkie
            </Button>
            <Button
              type="button"
              variant={uploadMode === "normal" ? "default" : "outline"}
              onClick={() => setUploadMode("normal")}
              className="flex-1"
              disabled={uploading}
            >
              Dodawanie normalne
            </Button>
          </div>

          {uploadMode === "quick" ? (
            /* Quick Upload Mode */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Szybkie dodawanie:</strong> Wybierz do 4 plików PDF.
                  Tytuły będą automatycznie pobrane z nazw plików.
                </p>
              </div>

              <div>
                <Label>Wybierz pliki PDF (maks. 4)</Label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleQuickFileSelect}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading || quickFiles.some((f) => f.uploading)}
                />
              </div>

              {quickFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Pliki do dodania ({quickFiles.length}/4):</Label>
                  {quickFiles.map((fileData, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fileData.file.name.replace(/\.[^/.]+$/, "")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fileData.uploading
                              ? "Uploadowanie..."
                              : "✓ Gotowy"}
                          </p>
                        </div>
                      </div>
                      {!fileData.uploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeQuickFile(fileData.file)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={uploading || quickFiles.some((f) => f.uploading)}
                >
                  Anuluj
                </Button>
                <Button
                  onClick={handleQuickSubmit}
                  disabled={
                    uploading ||
                    quickFiles.length === 0 ||
                    quickFiles.some((f) => f.uploading)
                  }
                >
                  {uploading ? "Dodawanie..." : `Dodaj (${quickFiles.length})`}
                </Button>
              </div>
            </div>
          ) : (
            /* Normal Upload Mode */
            <div className="space-y-4">
              <div>
                <Label htmlFor="material-title">Tytuł materiału *</Label>
                <Input
                  id="material-title"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="np. Teoria funkcji liniowych"
                  required
                  disabled={uploading}
                />
              </div>

              <div>
                <Label htmlFor="material-description">Opis</Label>
                <textarea
                  id="material-description"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[60px]"
                  placeholder="Krótki opis materiału..."
                  disabled={uploading}
                />
              </div>

              <div>
                <Label htmlFor="material-type">Typ materiału</Label>
                <select
                  id="material-type"
                  value={materialType}
                  onChange={(e) => {
                    setMaterialType(e.target.value as "PDF" | "LINK");
                    setUploadedFileUrl("");
                    setMaterialUrl("");
                  }}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading}
                >
                  <option value="PDF">Plik PDF</option>
                  <option value="LINK">Link</option>
                </select>
              </div>

              {materialType === "PDF" ? (
                <div>
                  <Label>Plik PDF *</Label>
                  <FileUpload
                    onUploadComplete={(data) => {
                      setUploadedFileUrl(data.url);
                      if (data.existingMaterialId) setExistingMaterialId(data.existingMaterialId);
                      if (data.hashCode) setHashCode(data.hashCode);
                      if (!materialTitle) {
                        setMaterialTitle(
                          data.filename.replace(/\.[^/.]+$/, "")
                        );
                      }
                    }}
                    acceptedTypes={[".pdf"]}
                    maxSize={100}
                  />
                  {uploadedFileUrl && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Plik został przesłany
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="material-link">URL *</Label>
                  <Input
                    id="material-link"
                    type="url"
                    value={materialUrl}
                    onChange={(e) => setMaterialUrl(e.target.value)}
                    placeholder="https://example.com/material"
                    required
                    disabled={uploading}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={uploading}
                >
                  Anuluj
                </Button>
                <Button onClick={handleNormalSubmit} disabled={uploading}>
                  {uploading ? "Dodawanie..." : "Dodaj"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Material Modal Component
function EditMaterialModal({
  onClose,
  onSubmit,
  defaultValues,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  defaultValues: Material | null;
}) {
  if (!defaultValues) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edytuj Materiał</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Tytuł materiału *</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={defaultValues.title}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Opis</Label>
              <textarea
                id="edit-description"
                name="description"
                defaultValue={defaultValues.description || ""}
                className="w-full p-2 border rounded-md min-h-[60px]"
                placeholder="Krótki opis materiału..."
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2 text-sm">
                {defaultValues.type === "PDF" ? (
                  <>
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="font-medium">Plik PDF</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Link</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 break-all">
                {defaultValues.content}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit">Zapisz zmiany</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
// Subchapter Modal Component
function SubchapterModal({
  onClose,
  onSubmit,
  title,
  defaultValues,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  defaultValues?: any;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-touch">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Tytuł podrozdziału *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={defaultValues?.title}
                placeholder="np. Wzór funkcji liniowej"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Opis</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={defaultValues?.description || ""}
                className="w-full p-2 border rounded-md min-h-[80px]"
                placeholder="Opis podrozdziału..."
              />
            </div>
            <div>
              <Label htmlFor="visibilityType">Typ widoczności</Label>
              <select
                id="visibilityType"
                name="visibilityType"
                defaultValue={defaultValues?.visibilityType || "MANUAL"}
                className="w-full p-2 border rounded-md"
              >
                <option value="MANUAL">Ręczna</option>
                <option value="DATE_BASED">Bazująca na dacie</option>
                <option value="PROGRESS_BASED">Bazująca na postępie</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="visibleFromDate">Widoczny od</Label>
                <Input
                  id="visibleFromDate"
                  name="visibleFromDate"
                  type="datetime-local"
                  defaultValue={
                    defaultValues?.visibleFromDate
                      ? new Date(defaultValues.visibleFromDate)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                />
              </div>
              <div>
                <Label htmlFor="visibleUntilDate">Widoczny do</Label>
                <Input
                  id="visibleUntilDate"
                  name="visibleUntilDate"
                  type="datetime-local"
                  defaultValue={
                    defaultValues?.visibleUntilDate
                      ? new Date(defaultValues.visibleUntilDate)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresPrevious"
                  name="requiresPrevious"
                  defaultChecked={defaultValues?.requiresPrevious}
                  className="w-4 h-4"
                />
                <Label htmlFor="requiresPrevious" className="cursor-pointer">
                  Wymaga ukończenia poprzedniego podrozdziału
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowSubmissions"
                  name="allowSubmissions"
                  defaultChecked={defaultValues?.allowSubmissions}
                  className="w-4 h-4"
                />
                <Label htmlFor="allowSubmissions" className="cursor-pointer">
                  Pozwala na przesyłanie rozwiązań
                </Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit">Zapisz</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
// Enroll Student Modal Component
function EnrollStudentModal({
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  enrolling,
  onSearch,
  onEnroll,
}: {
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  searching: boolean;
  enrolling: boolean;
  onSearch: (query: string) => void;
  onEnroll: (studentId: string) => void;
}) {
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      onSearch(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dodaj ucznia do kursu</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <Label htmlFor="student-search">
                <Search className="w-4 h-4 inline mr-2" />
                Wyszukaj ucznia
              </Label>
              <Input
                id="student-search"
                placeholder="Wpisz imię, nazwisko, email lub username..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 2 znaki do wyszukania
              </p>
            </div>

            {/* Search Results */}
            {searching && (
              <div className="text-center py-8">
                <p className="text-gray-600">Wyszukiwanie...</p>
              </div>
            )}

            {!searching &&
              searchQuery.length >= 2 &&
              searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nie znaleziono uczniów</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Spróbuj innego zapytania lub sprawdź, czy uczeń nie jest już
                    zapisany na ten kurs
                  </p>
                </div>
              )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Znaleziono uczniów ({searchResults.length}):
                </p>
                {searchResults.map((student) => (
                  <Card key={student.id} className="hover:shadow-md transition">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              @{student.username} • {student.email}
                            </p>
                            {student.enrolledCourses.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Zapisany na {student.enrolledCourses.length}{" "}
                                {student.enrolledCourses.length === 1
                                  ? "kurs"
                                  : "kursy"}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onEnroll(student.id)}
                          disabled={enrolling}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {enrolling ? "Dodawanie..." : "Dodaj"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Rozpocznij wpisywanie, aby wyszukać uczniów
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


