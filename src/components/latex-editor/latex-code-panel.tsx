"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

interface LatexCodePanelProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

export interface LatexCodePanelHandle {
  /** Inserts a snippet at the current cursor position (replacing any selection). */
  insertAtCursor: (snippet: string) => void;
}

/**
 * Left panel of the LaTeX editor — a styled textarea for writing LaTeX code.
 * Uses monospace font, supports Ctrl+S to trigger save, and adjusts tab behavior.
 */
export const LatexCodePanel = forwardRef<
  LatexCodePanelHandle,
  LatexCodePanelProps
>(function LatexCodePanel({ value, onChange, onSave }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    insertAtCursor(snippet: string) {
      const textarea = textareaRef.current;
      // Fallback: append at the end when the textarea is not mounted
      const start = textarea ? textarea.selectionStart : value.length;
      const end = textarea ? textarea.selectionEnd : value.length;

      const newValue = value.substring(0, start) + snippet + value.substring(end);
      onChange(newValue);

      const cursorAfter = start + snippet.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = cursorAfter;
          textareaRef.current.selectionEnd = cursorAfter;
        }
      }, 0);
    },
  }));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S / Cmd+S — trigger save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Tab key — insert 2 spaces instead of changing focus
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      // Restore cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Panel header */}
      <div className="flex items-center px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-gray-400 font-mono">LaTeX</span>
        </div>
        <span className="ml-auto text-xs text-gray-600">Ctrl+S — Zapisz i skompiluj</span>
      </div>

      {/* Code editor */}
      <div className="flex-1 relative overflow-hidden">
        {/* Line numbers */}
        <div
          className="absolute left-0 top-0 bottom-0 w-12 bg-gray-900 border-r border-gray-700 overflow-hidden pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="pt-3 px-2">
            {value.split("\n").map((_, i) => (
              <div
                key={i}
                className="text-right text-xs text-gray-600 font-mono leading-6"
                style={{ height: "1.5rem" }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Main textarea */}
        <textarea
          ref={textareaRef}
          id="latex-code-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="
            absolute inset-0 w-full h-full resize-none outline-none
            bg-transparent text-gray-100 font-mono text-sm leading-6
            pl-14 pr-4 pt-3 pb-4
            scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700
          "
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={`\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n\\usepackage{amsmath}\n\n\\begin{document}\n\n% Twój tekst LaTeX tutaj\n\n\\end{document}`}
          style={{
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
});
