"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIPromptTemplate {
  id: string;
  name: string;
  prompt: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AIPromptsPage() {
  const [templates, setTemplates] = useState<AIPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<AIPromptTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    prompt: "",
    description: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [defaultHomeworkFileName, setDefaultHomeworkFileName] =
    useState("Praca Domowa.pdf");
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/teacher/ai-prompts/settings");
      const data = await response.json();

      if (response.ok) {
        setDefaultHomeworkFileName(
          data.defaultHomeworkFileName || "Praca Domowa.pdf"
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch("/api/teacher/ai-prompts/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultHomeworkFileName }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: "Ustawienia zostały zapisane",
        });
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się zapisać ustawień",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas zapisywania ustawień",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/teacher/ai-prompts");
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać szablonów",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania szablonów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({ name: "", prompt: "", description: "" });
    setShowPreview(false);
    setShowModal(true);
  };

  const openEditModal = (template: AIPromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      prompt: template.prompt,
      description: template.description || "",
    });
    setShowPreview(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTemplate
        ? `/api/teacher/ai-prompts/${editingTemplate.id}`
        : "/api/teacher/ai-prompts";

      const response = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setShowModal(false);
        fetchTemplates();
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
        description: "Wystąpił błąd podczas zapisywania szablonu",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten szablon?")) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/ai-prompts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        fetchTemplates();
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
        description: "Wystąpił błąd podczas usuwania szablonu",
        variant: "destructive",
      });
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ustawienia Zapytań AI</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj szablonami promptów dla sprawdzania prac domowych
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nowy szablon
        </Button>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ustawienia domyślne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="homework-filename">
              Ustaw nazwę domyślnego pliku dla pracy domowej
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Nazwa pliku PDF z pracą domową, który będzie łączony ze zdjęciami
              przesłanymi przez ucznia
            </p>
            <div className="flex gap-2">
              <Input
                id="homework-filename"
                value={defaultHomeworkFileName}
                onChange={(e) => setDefaultHomeworkFileName(e.target.value)}
                placeholder="Praca Domowa.pdf"
                className="flex-1"
              />
              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Jeżeli pole jest puste, zostanie użyta domyślna nazwa: &quot;Praca
              Domowa.pdf&quot;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Brak szablonów</p>
              <Button onClick={openCreateModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Utwórz pierwszy szablon
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{template.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  <p>
                    Utworzono:{" "}
                    {new Date(template.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                  <p>
                    Zaktualizowano:{" "}
                    {new Date(template.updatedAt).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono max-h-20 overflow-hidden">
                  {template.prompt.substring(0, 100)}
                  {template.prompt.length > 100 && "..."}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edytuj szablon" : "Nowy szablon"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nazwa szablonu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="np. Sprawdzanie zadań matematycznych"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Opis (opcjonalny)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Krótki opis szablonu..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="prompt">Prompt AI * (Markdown)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Ukryj podgląd
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Pokaż podgląd
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) =>
                      setFormData({ ...formData, prompt: e.target.value })
                    }
                    className="w-full h-96 p-3 border rounded-md font-mono text-sm"
                    placeholder="Wpisz instrukcje dla AI w formacie Markdown..."
                    required
                  />
                </div>

                {showPreview && (
                  <div className="border rounded-md p-3 h-96 overflow-y-auto bg-gray-50">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{formData.prompt}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Zapisywanie..."
                  : editingTemplate
                  ? "Zaktualizuj"
                  : "Utwórz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
