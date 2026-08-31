"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode, Loader2, X } from "lucide-react";
import {
  LatexTemplatePicker,
  type LatexTemplateOption,
} from "./latex-template-picker";

interface LatexFilenameDialogProps {
  onConfirm: (title: string, templateId: string | null) => void;
  onClose: () => void;
  isCreating?: boolean;
}

/**
 * Dialog asking for a document name (and optionally a starting template)
 * before opening the LaTeX editor. Used as the entry point from the Dashboard.
 */
export function LatexFilenameDialog({
  onConfirm,
  onClose,
  isCreating = false,
}: LatexFilenameDialogProps) {
  const [title, setTitle] = useState("");
  const [templates, setTemplates] = useState<LatexTemplateOption[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Templates are optional — the picker is hidden when the teacher has none
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/teacher/latex-templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates ?? []);
        }
      } catch {
        // ignore — picker simply stays hidden
      }
    };
    fetchTemplates();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm(title.trim(), templateId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-modal p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileCode className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Nowy dokument LaTeX</CardTitle>
            </div>
            <Button
              id="latex-filename-dialog-close"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="latex-document-title" className="text-sm font-medium">
                Nazwa dokumentu *
              </Label>
              <Input
                id="latex-document-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Funkcje liniowe — teoria"
                required
                autoFocus
                disabled={isCreating}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ta nazwa będzie widoczna w edytorze i jako tytuł materiału po opublikowaniu.
              </p>
            </div>

            {templates.length > 0 && (
              <LatexTemplatePicker
                templates={templates}
                value={templateId}
                onChange={setTemplateId}
                disabled={isCreating}
              />
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
              >
                Anuluj
              </Button>
              <Button
                id="latex-filename-dialog-confirm"
                type="submit"
                disabled={!title.trim() || isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tworzenie...
                  </>
                ) : (
                  "Otwórz edytor"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

