"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Puzzle, Trash2 } from "lucide-react";

export interface LatexElementItem {
  id: string;
  name: string;
  snippetCode: string;
  createdAt: string;
}

interface LatexElementListProps {
  elements: LatexElementItem[];
  onEdit: (element: LatexElementItem) => void;
  onDelete: (element: LatexElementItem) => void;
  deletingId?: string | null;
}

/** List of the teacher's LaTeX elements with a code preview and Edit/Delete actions. */
export function LatexElementList({
  elements,
  onEdit,
  onDelete,
  deletingId = null,
}: LatexElementListProps) {
  return (
    <div className="grid gap-3">
      {elements.map((element) => (
        <Card key={element.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <Puzzle className="w-5 h-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {element.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Utworzono:{" "}
                    {new Date(element.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(element)}
                >
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Edytuj
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(element)}
                  disabled={deletingId === element.id}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Usuń
                </Button>
              </div>
            </div>

            <pre className="bg-gray-950 text-gray-100 text-xs font-mono rounded-md p-3 overflow-x-auto max-h-40">
              {element.snippetCode}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
