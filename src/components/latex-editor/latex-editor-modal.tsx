"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LatexCodePanel } from "./latex-code-panel";
import { LatexPreviewPanel } from "./latex-preview-panel";
import { LatexToolbar } from "./latex-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, ChevronDown } from "lucide-react";

// ─── Types for cascading course/chapter/subchapter selects ───────────────────

interface CourseOption {
  id: string;
  title: string;
  chapters: ChapterOption[];
}

interface ChapterOption {
  id: string;
  title: string;
  order: number;
}

interface SubchapterOption {
  id: string;
  title: string;
  order: number;
}

interface CompileResult {
  success: boolean;
  pdfBase64?: string;
  error?: string;
  log?: string;
}

interface PublishDialogProps {
  documentId: string;
  subchapterId?: string;           // pre-set when opened from "Dodaj Materiał"
  hasExistingMaterial: boolean;
  currentTitle: string;
  onPublished: (pdfUrl: string, newTitle: string) => void;
  onClose: () => void;
}

/**
 * Characters that are illegal in file names on both Windows and Linux,
 * plus the hyphen "-" which the user explicitly wants to forbid.
 * Windows forbidden: \ / : * ? " < > |
 * Linux forbidden:   / and null byte
 * Extra:             - (hyphen)
 */
const INVALID_FILENAME_CHARS = /[-\\/:|*?"<>\x00]/;

function getTitleError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Tytuł nie może być pusty.";
  const match = trimmed.match(/[-\\/:|*?"<>\x00]/g);
  if (match) {
    const unique = [...new Set(match)].map((c) => `„${c === "\x00" ? "NUL" : c}”`).join(", ");
    return `Niedozwolone znaki: ${unique}. Nie używaj myślnika (-) ani znaków specjalnych.`;
  }
  if (trimmed.length > 200) return "Tytuł może mieć maksymalnie 200 znaków.";
  return null;
}

function PublishDialog({
  documentId,
  subchapterId,
  hasExistingMaterial,
  currentTitle,
  onPublished,
  onClose,
}: PublishDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [titleError, setTitleError] = useState<string | null>(
    () => getTitleError(currentTitle)
  );
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cascading selects state ─────────────────────────────────────────────────
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [chapters, setChapters] = useState<ChapterOption[]>([]);

  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [subchapters, setSubchapters] = useState<SubchapterOption[]>([]);
  const [loadingSubchapters, setLoadingSubchapters] = useState(false);

  const [selectedSubchapterId, setSelectedSubchapterId] = useState(subchapterId ?? "");

  // ── Load courses on mount (only when no pre-set subchapterId) ───────────────
  useEffect(() => {
    if (hasExistingMaterial || subchapterId) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch("/api/teacher/courses");
        if (res.ok) {
          const data = await res.json();
          // courses already include chapters in the list response
          setCourses(data.courses ?? []);
        }
      } catch {
        // ignore — user will see empty select
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [hasExistingMaterial, subchapterId]);

  // ── When course changes, populate chapters and reset downstream ─────────────
  useEffect(() => {
    if (!selectedCourseId) {
      setChapters([]);
      setSelectedChapterId("");
      setSubchapters([]);
      setSelectedSubchapterId("");
      return;
    }
    const course = courses.find((c) => c.id === selectedCourseId);
    const sorted = (course?.chapters ?? []).slice().sort((a, b) => a.order - b.order);
    setChapters(sorted);
    setSelectedChapterId("");
    setSubchapters([]);
    setSelectedSubchapterId("");
  }, [selectedCourseId, courses]);

  // ── When chapter changes, fetch subchapters ─────────────────────────────────
  useEffect(() => {
    if (!selectedChapterId) {
      setSubchapters([]);
      setSelectedSubchapterId("");
      return;
    }

    const fetchSubchapters = async () => {
      setLoadingSubchapters(true);
      setSubchapters([]);
      setSelectedSubchapterId("");
      try {
        const res = await fetch(`/api/teacher/courses/${selectedCourseId}`);
        if (res.ok) {
          const data = await res.json();
          const chapter = (data.course?.chapters ?? []).find(
            (ch: any) => ch.id === selectedChapterId
          );
          const sorted = (chapter?.subchapters ?? []).slice().sort(
            (a: SubchapterOption, b: SubchapterOption) => a.order - b.order
          );
          setSubchapters(sorted);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSubchapters(false);
      }
    };
    fetchSubchapters();
  }, [selectedChapterId, selectedCourseId]);

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    const titleErr = getTitleError(title);
    if (titleErr) { setError(titleErr); return; }
    if (!hasExistingMaterial && !subchapterId && !selectedSubchapterId) {
      setError("Wybierz kurs, rozdział i podrozdział");
      return;
    }

    setPublishing(true);
    setError(null);

    const finalSubchapterId = subchapterId || selectedSubchapterId;

    const res = await fetch(`/api/teacher/latex-documents/${documentId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        subchapterId: hasExistingMaterial ? undefined : finalSubchapterId,
      }),
    });

    const data = await res.json();
    setPublishing(false);

    if (res.ok) {
      onPublished(data.pdfUrl, title.trim());
    } else if (data.log) {
      setError(`Błąd kompilacji:\n${data.log}`);
    } else {
      setError(data.error ?? "Błąd publikacji");
    }
  };

  const canPublish =
    !titleError &&
    !!title.trim() &&
    (hasExistingMaterial || !!subchapterId || !!selectedSubchapterId);

  // ── Shared select style ─────────────────────────────────────────────────────
  const selectCls =
    "w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" +
    " focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
    " disabled:cursor-not-allowed disabled:opacity-50 appearance-none";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {hasExistingMaterial ? "Aktualizuj materiał PDF" : "Publikuj jako nowy materiał"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={publishing}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="publish-title">Tytuł materiału *</Label>
            <Input
              id="publish-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(getTitleError(e.target.value));
              }}
              placeholder="np. Funkcje liniowe teoria"
              disabled={publishing}
              className={`mt-1 ${titleError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {titleError ? (
              <p className="text-xs text-red-500 mt-1">{titleError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Dozwolone: litery, cyfry, spacje, podkreślnik (_), kropka (.). Bez myślnika (-).
              </p>
            )}
          </div>

          {/* Cascading selects — only for first publish without pre-set subchapterId */}
          {!hasExistingMaterial && !subchapterId && (
            <>
              {/* Course */}
              <div>
                <Label htmlFor="publish-course">Kurs *</Label>
                <div className="relative">
                  <select
                    id="publish-course"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    disabled={publishing || loadingCourses}
                    className={selectCls}
                  >
                    <option value="">
                      {loadingCourses ? "Ładowanie kursów…" : "— Wybierz kurs —"}
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Chapter */}
              <div>
                <Label htmlFor="publish-chapter">Rozdział *</Label>
                <div className="relative">
                  <select
                    id="publish-chapter"
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    disabled={publishing || !selectedCourseId}
                    className={selectCls}
                  >
                    <option value="">
                      {!selectedCourseId ? "Najpierw wybierz kurs" : "— Wybierz rozdział —"}
                    </option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Subchapter */}
              <div>
                <Label htmlFor="publish-subchapter">Podrozdział *</Label>
                <div className="relative">
                  <select
                    id="publish-subchapter"
                    value={selectedSubchapterId}
                    onChange={(e) => setSelectedSubchapterId(e.target.value)}
                    disabled={publishing || !selectedChapterId || loadingSubchapters}
                    className={selectCls}
                  >
                    <option value="">
                      {loadingSubchapters
                        ? "Ładowanie podrozdziałów…"
                        : !selectedChapterId
                        ? "Najpierw wybierz rozdział"
                        : subchapters.length === 0
                        ? "Brak podrozdziałów w tym rozdziale"
                        : "— Wybierz podrozdział —"}
                    </option>
                    {subchapters.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Materiał zostanie przypisany do wybranego podrozdziału.
                </p>
              </div>
            </>
          )}

          {error && (
            <pre className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
              {error}
            </pre>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={publishing}>
              Anuluj
            </Button>
            <Button
              id="publish-dialog-confirm"
              onClick={handlePublish}
              disabled={publishing || !canPublish}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kompilowanie i publikowanie...
                </>
              ) : (
                hasExistingMaterial ? "Zaktualizuj PDF" : "Opublikuj"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Editor Modal ────────────────────────────────────────────────────────

interface LatexEditorModalProps {
  documentId: string;              // The LatexDocument.id to work with
  subchapterId?: string;           // Pre-set when opened from "Dodaj Materiał"
  onClose: () => void;
  onPublished?: (pdfUrl: string) => void;
}

const DEFAULT_TEMPLATE = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[polish]{babel}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}

\\title{Tytuł dokumentu}
\\author{Autor}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Wstęp}

Tutaj wpisz swój tekst.

\\end{document}`;

export function LatexEditorModal({
  documentId,
  subchapterId,
  onClose,
  onPublished,
}: LatexEditorModalProps) {
  const [sourceCode, setSourceCode] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [hasExistingMaterial, setHasExistingMaterial] = useState(false);
  const [loading, setLoading] = useState(true);

  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedCodeRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load document on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      const res = await fetch(`/api/teacher/latex-documents/${documentId}`);
      if (res.ok) {
        const data = await res.json();
        const doc = data.document;
        const code = doc.sourceCode || DEFAULT_TEMPLATE;
        setSourceCode(code);
        setDocumentTitle(doc.title);
        setHasExistingMaterial(!!doc.materialId);
        savedCodeRef.current = code;
      }
      setLoading(false);
    };
    loadDocument();
  }, [documentId]);

  // ── Track unsaved changes ──────────────────────────────────────────────────
  useEffect(() => {
    setHasUnsavedChanges(sourceCode !== savedCodeRef.current);
  }, [sourceCode]);

  // ── Compile (live preview) ─────────────────────────────────────────────────
  const compile = useCallback(async (code?: string) => {
    setIsCompiling(true);
    setCompileResult(null);

    const res = await fetch(`/api/teacher/latex-documents/${documentId}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceCode: code ?? sourceCode }),
    });

    const data = await res.json();
    setIsCompiling(false);

    if (res.ok && data.success) {
      setCompileResult({ success: true, pdfBase64: data.pdfBase64 });
    } else {
      setCompileResult({
        success: false,
        error: data.error ?? "Błąd kompilacji",
        log: data.log ?? "",
      });
    }
  }, [documentId, sourceCode]);

  // ── Save (PUT) + compile ───────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    // Cancel any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const res = await fetch(`/api/teacher/latex-documents/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceCode }),
    });

    if (res.ok) {
      savedCodeRef.current = sourceCode;
      setHasUnsavedChanges(false);
    }
    setIsSaving(false);

    // Compile for preview
    await compile(sourceCode);
  }, [documentId, sourceCode, compile]);

  // ── Debounced auto-compile after 2s of inactivity ─────────────────────────
  const handleCodeChange = useCallback((newCode: string) => {
    setSourceCode(newCode);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Auto-compile after 2s of no typing (does NOT auto-save)
    debounceRef.current = setTimeout(() => {
      compile(newCode);
    }, 2000);
  }, [compile]);

  // ── Keyboard shortcut Ctrl+S ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // ── Close with unsaved changes warning ────────────────────────────────────
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz zamknąć edytor?")) {
        return;
      }
    }
    onClose();
  };

  // ── After publish ─────────────────────────────────────────────────────────
  const handlePublished = (pdfUrl: string, newTitle: string) => {
    setShowPublishDialog(false);
    setHasExistingMaterial(true);
    setDocumentTitle(newTitle);   // ← sync toolbar title immediately
    onPublished?.(pdfUrl);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4 text-gray-300">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          <p className="text-sm">Ładowanie dokumentu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen editor */}
      <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
        {/* Toolbar */}
        <LatexToolbar
          documentTitle={documentTitle}
          isSaving={isSaving}
          isCompiling={isCompiling}
          isPublishing={false}
          onSave={handleSave}
          onPublish={() => setShowPublishDialog(true)}
          onClose={handleClose}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Split editor */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: code */}
          <div className="w-1/2 flex flex-col border-r border-gray-700 overflow-hidden">
            <LatexCodePanel
              value={sourceCode}
              onChange={handleCodeChange}
              onSave={handleSave}
            />
          </div>

          {/* Right: preview */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <LatexPreviewPanel
              compileResult={compileResult}
              isCompiling={isCompiling}
            />
          </div>
        </div>
      </div>

      {/* Publish dialog — rendered on top of editor */}
      {showPublishDialog && (
        <PublishDialog
          documentId={documentId}
          subchapterId={subchapterId}
          hasExistingMaterial={hasExistingMaterial}
          currentTitle={documentTitle}
          onPublished={handlePublished}
          onClose={() => setShowPublishDialog(false)}
        />
      )}
    </>
  );
}
