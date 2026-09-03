"use client";

import { AlertTriangle, FileText, Loader2 } from "lucide-react";

interface CompileResult {
  success: boolean;
  pdfBase64?: string;
  error?: string;
  log?: string;
}

interface LatexPreviewPanelProps {
  compileResult: CompileResult | null;
  isCompiling: boolean;
}

/**
 * Right panel of the LaTeX editor — shows live PDF preview or compilation error log.
 */
export function LatexPreviewPanel({ compileResult, isCompiling }: LatexPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      {/* Panel header */}
      <div className="flex items-center px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Podgląd PDF</span>
        </div>
        {isCompiling && (
          <div className="ml-auto flex items-center gap-2 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Kompilowanie...
          </div>
        )}
        {!isCompiling && compileResult && (
          <span
            className={`ml-auto text-xs font-medium ${
              compileResult.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {compileResult.success ? "✓ Sukces" : "✗ Błąd kompilacji"}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* Loading state */}
        {isCompiling && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-sm">Kompilowanie kodu LaTeX...</p>
          </div>
        )}

        {/* Empty state — no compile result yet */}
        {!isCompiling && !compileResult && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <FileText className="w-16 h-16 text-gray-200" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Brak podglądu</p>
              <p className="text-xs mt-1">
                Naciśnij <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">Ctrl+S</kbd> lub kliknij „Zapisz", aby skompilować
              </p>
            </div>
          </div>
        )}

        {/* PDF Preview — success */}
        {!isCompiling && compileResult?.success && compileResult.pdfBase64 && (
          <iframe
            src={`data:application/pdf;base64,${compileResult.pdfBase64}`}
            className="w-full h-full border-0"
            title="Podgląd PDF"
            aria-label="Podgląd skompilowanego PDF"
          />
        )}

        {/* Error log — compilation failed */}
        {!isCompiling && compileResult && !compileResult.success && (
          <div className="h-full overflow-auto p-4">
            <div className="flex items-start gap-3 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {compileResult.error ?? "Błąd kompilacji LaTeX"}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Sprawdź log poniżej i popraw błędy w kodzie
                </p>
              </div>
            </div>

            {compileResult.log && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Log kompilacji:
                </p>
                <pre
                  className="
                    text-xs font-mono bg-gray-900 text-gray-100 p-4
                    rounded-lg overflow-x-auto whitespace-pre-wrap break-words
                    max-h-[calc(100vh-300px)] overflow-y-auto
                  "
                >
                  {compileResult.log}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
