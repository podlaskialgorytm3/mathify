"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LatexCodePanel } from "./latex-code-panel";
import { LatexPreviewPanel } from "./latex-preview-panel";
import { LatexToolbar } from "./latex-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";

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
  onPublished: (pdfUrl: string) => void;
  onClose: () => void;
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
  const [subId, setSubId] = useState(subchapterId ?? "");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!title.trim()) { setError("Podaj tytuł materiału"); return; }
    if (!hasExistingMaterial && !subId.trim()) { setError("Podaj ID podrozdziału"); return; }

    setPublishing(true);
    setError(null);

    const res = await fetch(`/api/teacher/latex-documents/${documentId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        subchapterId: hasExistingMaterial ? undefined : subId.trim(),
      }),
    });

    const data = await res.json();
    setPublishing(false);

    if (res.ok) {
      onPublished(data.pdfUrl);
    } else if (data.log) {
      setError(`Błąd kompilacji:\n${data.log}`);
    } else {
      setError(data.error ?? "Błąd publikacji");
    }
  };

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
          <div>
            <Label htmlFor="publish-title">Tytuł materiału *</Label>
            <Input
              id="publish-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Funkcje liniowe — teoria"
              disabled={publishing}
              className="mt-1"
            />
          </div>

          {/* SubchapterId field — only needed for first publish */}
          {!hasExistingMaterial && !subchapterId && (
            <div>
              <Label htmlFor="publish-subchapter">ID podrozdziału *</Label>
              <Input
                id="publish-subchapter"
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
                placeholder="cuid podrozdziału"
                disabled={publishing}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dokument zostanie przypisany do tego podrozdziału.
              </p>
            </div>
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
              disabled={publishing || !title.trim()}
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
  const handlePublished = (pdfUrl: string) => {
    setShowPublishDialog(false);
    setHasExistingMaterial(true);
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
