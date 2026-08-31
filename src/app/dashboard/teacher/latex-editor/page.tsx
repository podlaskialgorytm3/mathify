"use client";

import { useState } from "react";
import { LatexFilenameDialog } from "@/components/latex-editor/latex-filename-dialog";
import { LatexEditorModal } from "@/components/latex-editor/latex-editor-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileCode, Plus, Clock } from "lucide-react";
import { useEffect } from "react";

interface LatexDocumentSummary {
  id: string;
  title: string;
  materialId: string | null;
  updatedAt: string;
  material?: { id: string; title: string } | null;
}

/**
 * Dashboard entry point for the LaTeX editor.
 * Shows a list of existing LaTeX documents and allows creating new ones.
 */
export default function LatexEditorPage() {
  const [showFilenameDialog, setShowFilenameDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<LatexDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    const res = await fetch("/api/teacher/latex-documents");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async (
    title: string,
    templateId: string | null,
  ) => {
    setIsCreating(true);
    const res = await fetch("/api/teacher/latex-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sourceCode: "",
        ...(templateId ? { templateId } : {}),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setShowFilenameDialog(false);
      setIsCreating(false);
      setActiveDocumentId(data.document.id);
    } else {
      setIsCreating(false);
      alert("Nie udało się utworzyć dokumentu. Spróbuj ponownie.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCode className="w-6 h-6 text-blue-600" />
            Edycja i Kompilacja Materiałów
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Twórz materiały PDF bezpośrednio w aplikacji za pomocą edytora LaTeX
          </p>
        </div>
        <Button
          id="latex-editor-new-document"
          onClick={() => setShowFilenameDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nowy dokument
        </Button>
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Ładowanie dokumentów...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <FileCode className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Brak dokumentów LaTeX</p>
              <p className="text-sm text-gray-500 mt-1">
                Kliknij „Nowy dokument", aby zacząć tworzyć materiały w edytorze LaTeX
              </p>
            </div>
            <Button
              id="latex-editor-create-first"
              onClick={() => setShowFilenameDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Utwórz pierwszy dokument
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setActiveDocumentId(doc.id)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <FileCode className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.updatedAt).toLocaleDateString("pl-PL", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      {doc.material ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Opublikowany
                        </span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          Roboczy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDocumentId(doc.id);
                  }}
                >
                  Otwórz edytor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filename dialog */}
      {showFilenameDialog && (
        <LatexFilenameDialog
          onConfirm={handleCreateDocument}
          onClose={() => {
            setShowFilenameDialog(false);
            setIsCreating(false);
          }}
          isCreating={isCreating}
        />
      )}

      {/* LaTeX Editor Modal */}
      {activeDocumentId && (
        <LatexEditorModal
          documentId={activeDocumentId}
          onClose={() => setActiveDocumentId(null)}
          onPublished={() => {
            setActiveDocumentId(null);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
