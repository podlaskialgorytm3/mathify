"use client";

import { FileCode, LayoutTemplate } from "lucide-react";

export interface LatexTemplateOption {
  id: string;
  title: string;
}

interface LatexTemplatePickerProps {
  templates: LatexTemplateOption[];
  /** `null` means "start from an empty document". */
  value: string | null;
  onChange: (templateId: string | null) => void;
  disabled?: boolean;
}

/**
 * Optional template selection shown while creating a new LaTeX material.
 * The parent is responsible for rendering this only when at least one template exists.
 * The chosen template's source code is COPIED server-side on document creation.
 */
export function LatexTemplatePicker({
  templates,
  value,
  onChange,
  disabled = false,
}: LatexTemplatePickerProps) {
  if (templates.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium">Szablon startowy</p>
      <p className="text-xs text-gray-500 mt-0.5 mb-2">
        Kod szablonu zostanie skopiowany do nowego dokumentu. Późniejsze zmiany
        szablonu nie wpłyną na ten materiał.
      </p>

      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm transition-colors ${
            value === null
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 hover:bg-gray-50 text-gray-700"
          }`}
        >
          <FileCode className="w-4 h-4 flex-shrink-0" />
          Zacznij od pustego
        </button>

        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(template.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm transition-colors ${
              value === template.id
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <LayoutTemplate className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{template.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
