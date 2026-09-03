"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";

interface PDFViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function PDFViewer({ url, title, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-modal flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 shadow-xl w-full h-full max-w-6xl sm:rounded-lg sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-3 p-3 border-b dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:p-4 safe-top">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="sm:hidden flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="ml-auto sm:ml-0"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pobierz</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hidden sm:inline-flex"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto scroll-touch bg-gray-100 dark:bg-gray-800 p-2 sm:p-4 safe-bottom">
          <div
            className="mx-auto bg-white shadow-lg"
            style={{
              width: `${zoom}%`,
              minHeight: "100%",
            }}
          >
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full"
              style={{ minHeight: "calc(90vh - 100px)" }}
              title={title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

