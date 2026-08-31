"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Puzzle, X } from "lucide-react";

export interface LatexElementFormValue {
  id?: string;
  name: string;
  snippetCode: string;
}

interface LatexElementFormDialogProps {
  /** When provided, the dialog edits this element; otherwise it creates a new one. */
  element?: LatexElementFormValue | null;
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Create/edit dialog for a LaTeX element (a named, reusable code snippet).
 * Deliberately simple — an element is usually a short fragment, so no split-screen editor.
 */
export function LatexElementFormDialog({
  element,
  onSaved,
  onClose,
}: LatexElementFormDialogProps) {
  const isEdit = !!element?.id;
  const [name, setName] = useState(element?.name ?? "");
  const [snippetCode, setSnippetCode] = useState(element?.snippetCode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !snippetCode.trim()) return;

    setSaving(true);
    setError(null);

    const res = await fetch(
      isEdit
        ? `/api/teacher/latex-elements/${element!.id}`
        : "/api/teacher/latex-elements",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), snippetCode }),
      },
    );

    setSaving(false);

    if (res.ok) {
      onSaved();
    } else {
      setError("Nie udało się zapisać elementu. Spróbuj ponownie.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-modal p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl shadow-2xl border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Puzzle className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">
                {isEdit ? "Edytuj element" : "Nowy element"}
              </CardTitle>
            </div>
            <Button
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
              <Label htmlFor="latex-element-name" className="text-sm font-medium">
                Nazwa elementu *
              </Label>
              <Input
                id="latex-element-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Kratka do liczb"
                required
                autoFocus
                disabled={saving}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label
                htmlFor="latex-element-snippet"
                className="text-sm font-medium"
              >
                Kod LaTeX *
              </Label>
              <textarea
                id="latex-element-snippet"
                value={snippetCode}
                onChange={(e) => setSnippetCode(e.target.value)}
                required
                disabled={saving}
                rows={12}
                spellCheck={false}
                placeholder={"\\begin{tabular}{|c|c|c|}\n  \\hline\n   &  &  \\\\\n  \\hline\n\\end{tabular}"}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-gray-950 text-gray-100 font-mono text-sm p-3 leading-6 outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  fontFamily:
                    "'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
                  tabSize: 2,
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Fragment kodu — nie musi być samodzielnie kompilowalnym dokumentem.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                Anuluj
              </Button>
              <Button
                id="latex-element-form-submit"
                type="submit"
                disabled={!name.trim() || !snippetCode.trim() || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </>
                ) : isEdit ? (
                  "Zapisz zmiany"
                ) : (
                  "Utwórz element"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
