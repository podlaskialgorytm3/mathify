"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Puzzle } from "lucide-react";

export interface LatexElementSummary {
  id: string;
  name: string;
  snippetCode: string;
}

interface LatexElementPickerProps {
  /** Called with the snippet code of the chosen element. */
  onInsert: (snippetCode: string) => void;
  disabled?: boolean;
}

/**
 * "Dodaj element" button used inside the LaTeX editor toolbar.
 * Fetches the teacher's elements and inserts the chosen snippet at the cursor.
 * Purely client-side insertion — nothing is persisted until the editor is saved.
 */
export function LatexElementPicker({
  onInsert,
  disabled = false,
}: LatexElementPickerProps) {
  const [open, setOpen] = useState(false);
  const [elements, setElements] = useState<LatexElementSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/latex-elements");
        if (res.ok) {
          const data = await res.json();
          setElements(data.elements ?? []);
          setLoaded(true);
        }
      } catch {
        // ignore — user sees empty list
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        id="latex-element-picker-trigger"
        size="sm"
        variant="outline"
        onClick={toggle}
        disabled={disabled}
        className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
        title="Wstaw element w miejscu kursora"
      >
        <Puzzle className="w-4 h-4" />
        <span className="ml-1.5 hidden sm:block">Dodaj element</span>
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-modal">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Twoje elementy
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-gray-500 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ładowanie...
            </div>
          ) : elements.length === 0 ? (
            <p className="px-3 py-6 text-sm text-gray-500 text-center">
              Brak elementów. Dodaj je w sekcji „Zarządzanie elementami”.
            </p>
          ) : (
            <ul className="py-1">
              {elements.map((element) => (
                <li key={element.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onInsert(element.snippetCode);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {element.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {element.snippetCode.split("\n")[0]}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
