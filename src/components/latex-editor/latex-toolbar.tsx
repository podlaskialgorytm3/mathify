"use client";

import { Button } from "@/components/ui/button";
import { Save, FileDown, Loader2, FileCode, X } from "lucide-react";

interface LatexToolbarProps {
  documentTitle: string;
  isSaving: boolean;
  isCompiling: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onClose: () => void;
  hasUnsavedChanges: boolean;
}

/**
 * Toolbar at the top of the LaTeX editor modal.
 * Contains: document title, Save (Ctrl+S), Publish to materials, Close.
 */
export function LatexToolbar({
  documentTitle,
  isSaving,
  isCompiling,
  isPublishing,
  onSave,
  onPublish,
  onClose,
  hasUnsavedChanges,
}: LatexToolbarProps) {
  const busy = isSaving || isCompiling || isPublishing;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-700 flex-shrink-0">
      {/* Logo / icon */}
      <div className="flex items-center gap-2 mr-2">
        <FileCode className="w-5 h-5 text-blue-400" />
        <span className="text-sm font-semibold text-white hidden sm:block">
          Edytor LaTeX
        </span>
      </div>

      {/* Document title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm text-gray-200 font-medium truncate">
          {documentTitle || "Bez nazwy"}
        </span>
        {hasUnsavedChanges && (
          <span
            className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"
            title="Niezapisane zmiany"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Save & Compile */}
        <Button
          id="latex-toolbar-save"
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={busy}
          className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
          title="Zapisz i skompiluj (Ctrl+S)"
        >
          {isSaving || isCompiling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="ml-1.5 hidden sm:block">
            {isSaving ? "Zapisywanie..." : isCompiling ? "Kompilowanie..." : "Zapisz"}
          </span>
        </Button>

        {/* Publish as PDF */}
        <Button
          id="latex-toolbar-publish"
          size="sm"
          onClick={onPublish}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          title="Zapisz jako PDF i wstaw do materiałów"
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span className="ml-1.5 hidden sm:block">
            {isPublishing ? "Publikowanie..." : "Zapisz jako PDF i wstaw"}
          </span>
        </Button>

        {/* Close */}
        <Button
          id="latex-toolbar-close"
          size="sm"
          variant="ghost"
          onClick={onClose}
          disabled={isPublishing}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
          title="Zamknij edytor"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
