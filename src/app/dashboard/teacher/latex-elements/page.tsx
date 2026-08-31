"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LatexElementList,
  type LatexElementItem,
} from "@/components/latex-editor/latex-element-list";
import { LatexElementFormDialog } from "@/components/latex-editor/latex-element-form-dialog";
import { Plus, Puzzle } from "lucide-react";

/** "Zarządzanie elementami" — CRUD for reusable LaTeX snippets. */
export default function LatexElementsPage() {
  const [elements, setElements] = useState<LatexElementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LatexElementItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchElements = async () => {
    setLoading(true);
    const res = await fetch("/api/teacher/latex-elements");
    if (res.ok) {
      const data = await res.json();
      setElements(data.elements ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchElements();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (element: LatexElementItem) => {
    setEditing(element);
    setShowForm(true);
  };

  const handleDelete = async (element: LatexElementItem) => {
    if (
      !window.confirm(
        `Usunąć element „${element.name}"? Materiały, w których został już wstawiony, pozostaną bez zmian.`,
      )
    ) {
      return;
    }

    setDeletingId(element.id);
    const res = await fetch(`/api/teacher/latex-elements/${element.id}`, {
      method: "DELETE",
    });
    setDeletingId(null);

    if (res.ok) {
      fetchElements();
    } else {
      alert("Nie udało się usunąć elementu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Puzzle className="w-6 h-6 text-blue-600" />
            Zarządzanie elementami
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Elementy to nazwane fragmenty kodu LaTeX, które możesz wstawiać wiele
            razy w dowolnym miejscu materiału.
          </p>
        </div>
        <Button
          id="latex-element-create"
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Stwórz element
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Ładowanie elementów...
        </div>
      ) : elements.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <Puzzle className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Brak elementów</p>
              <p className="text-sm text-gray-500 mt-1">
                Stwórz pierwszy element, np. kratkę do liczb albo ramkę na zadanie.
              </p>
            </div>
            <Button
              id="latex-element-create-first"
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Stwórz pierwszy element
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LatexElementList
          elements={elements}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {showForm && (
        <LatexElementFormDialog
          element={editing}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            fetchElements();
          }}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
