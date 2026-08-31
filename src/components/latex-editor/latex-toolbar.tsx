"use client";

import { Button } from "@/components/ui/button";
import { Save, FileDown, Loader2, FileCode, X } from "lucide-react";
import { LatexElementPicker } from "./latex-element-picker";

interface LatexToolbarProps {
  documentTitle: string;
  isSaving: boolean;
  isCompiling: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onClose: () => void;
  hasUnsavedChanges: boolean;
  /** "document" publishes to materials, "template" only saves the template. */
  entityType?: "document" | "template";
  /** Inserts an element snippet at the cursor position in the code panel. */
  onInsertElement?: (snippetCode: string) => void;
}

/**
 * Toolbar at the top of the LaTeX editor modal.
 * Contains: document title, Save (Ctrl+S), element picker, Publish/Save template, Close.
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
  entityType = "document",
  onInsertElement,
}: LatexToolbarProps) {
  const busy = isSaving || isCompiling || isPublishing;
  const isTemplate = entityType === "template";

  return (
    <div className="safe-top safe-x flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 bg-gray-900 border-b border-gray-700 flex-shrink-0">
      {/* Logo / icon */}
      <div className="flex items-center gap-2 sm:mr-2">
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

        {/* Insert element at cursor */}
        {onInsertElement && (
          <LatexElementPicker onInsert={onInsertElement} disabled={busy} />
        )}

        {/* Publish as PDF (documents) / Save template */}
        <Button
          id={isTemplate ? "latex-toolbar-save-template" : "latex-toolbar-publish"}
          size="sm"
          onClick={onPublish}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          title={
            isTemplate
              ? "Zapisz szablon"
              : "Zapisz jako PDF i wstaw do materiałów"
          }
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isTemplate ? (
            <Save className="w-4 h-4" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span className="ml-1.5 hidden sm:block">
            {isTemplate
              ? "Zapisz szablon"
              : isPublishing
                ? "Publikowanie..."
                : "Zapisz jako PDF i wstaw"}
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
