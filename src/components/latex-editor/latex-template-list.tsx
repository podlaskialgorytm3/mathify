"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LayoutTemplate, Pencil, Trash2 } from "lucide-react";

export interface LatexTemplateItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface LatexTemplateListProps {
  templates: LatexTemplateItem[];
  onEdit: (template: LatexTemplateItem) => void;
  onDelete: (template: LatexTemplateItem) => void;
  deletingId?: string | null;
}

/** List of the teacher's LaTeX templates with Edit/Delete actions. */
export function LatexTemplateList({
  templates,
  onEdit,
  onDelete,
  deletingId = null,
}: LatexTemplateListProps) {
  return (
    <div className="grid gap-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEdit(template)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <LayoutTemplate className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {template.title}
                </p>
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Ostatnia edycja:{" "}
                  {new Date(template.updatedAt).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(template);
                }}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edytuj
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template);
                }}
                disabled={deletingId === template.id}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Usuń
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
