"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LatexEditorModal } from "@/components/latex-editor/latex-editor-modal";
import {
  LatexTemplateList,
  type LatexTemplateItem,
} from "@/components/latex-editor/latex-template-list";
import { LayoutTemplate, Loader2, Plus, X } from "lucide-react";

const DEFAULT_TEMPLATE_CODE = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[polish]{babel}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}

\\begin{document}

\\section{Wstęp}

Tutaj wpisz swój tekst.

\\end{document}`;

/** "Zarządzanie szablonami" — list of the teacher's LaTeX templates with full CRUD. */
export default function LatexTemplatesPage() {
  const [templates, setTemplates] = useState<LatexTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch("/api/teacher/latex-templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    const res = await fetch("/api/teacher/latex-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        sourceCode: DEFAULT_TEMPLATE_CODE,
      }),
    });
    setIsCreating(false);

    if (res.ok) {
      const data = await res.json();
      setShowNameDialog(false);
      setNewTitle("");
      setActiveTemplateId(data.template.id);
      fetchTemplates();
    } else {
      alert("Nie udało się utworzyć szablonu. Spróbuj ponownie.");
    }
  };

  const handleDelete = async (template: LatexTemplateItem) => {
    if (
      !window.confirm(
        `Usunąć szablon „${template.title}"? Materiały utworzone na jego bazie pozostaną bez zmian.`,
      )
    ) {
      return;
    }

    setDeletingId(template.id);
    const res = await fetch(`/api/teacher/latex-templates/${template.id}`, {
      method: "DELETE",
    });
    setDeletingId(null);

    if (res.ok) {
      fetchTemplates();
    } else {
      alert("Nie udało się usunąć szablonu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-blue-600" />
            Zarządzanie szablonami
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Szablony to gotowy punkt startowy dla nowych materiałów — ich kod jest
            kopiowany przy tworzeniu dokumentu.
          </p>
        </div>
        <Button
          id="latex-template-create"
          onClick={() => setShowNameDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Stwórz szablon
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Ładowanie szablonów...
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <LayoutTemplate className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Brak szablonów</p>
              <p className="text-sm text-gray-500 mt-1">
                Stwórz pierwszy szablon, aby zacząć nowe materiały bez pisania
                boilerplate&apos;u od zera.
              </p>
            </div>
            <Button
              id="latex-template-create-first"
              onClick={() => setShowNameDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Stwórz pierwszy szablon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LatexTemplateList
          templates={templates}
          onEdit={(template) => setActiveTemplateId(template.id)}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {/* Name dialog for a new template */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-modal p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <LayoutTemplate className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Nowy szablon</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNameDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label
                    htmlFor="latex-template-title"
                    className="text-sm font-medium"
                  >
                    Nazwa szablonu *
                  </Label>
                  <Input
                    id="latex-template-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="np. Karta pracy — nagłówek standardowy"
                    required
                    autoFocus
                    disabled={isCreating}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNameDialog(false)}
                    disabled={isCreating}
                  >
                    Anuluj
                  </Button>
                  <Button
                    id="latex-template-name-confirm"
                    type="submit"
                    disabled={!newTitle.trim() || isCreating}
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
      )}

      {/* Editor in template mode — never publishes to materials */}
      {activeTemplateId && (
        <LatexEditorModal
          entityType="template"
          entityId={activeTemplateId}
          onClose={() => {
            setActiveTemplateId(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}
