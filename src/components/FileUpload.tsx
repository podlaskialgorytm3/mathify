"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onUploadComplete: (data: {
    url: string;
    publicId: string;
    filename: string;
  }) => void;
  acceptedTypes?: string[];
  maxSize?: number; // w MB
}

export default function FileUpload({
  onUploadComplete,
  acceptedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".mp4"],
  maxSize = 100,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    // Walidacja rozmiaru
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Plik za duży. Maksymalny rozmiar: ${maxSize} MB`);
      return;
    }

    // Walidacja typu - sprawdź extension i MIME type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const acceptedTypesLower = acceptedTypes.map((t) => t.toLowerCase());

    const isValidExtension = acceptedTypesLower.includes(fileExtension);
    const isValidMimeType =
      file.type === "" || // Przeglądarka nie rozpoznała typu
      file.type === "application/pdf" ||
      file.type.startsWith("image/") ||
      file.type.startsWith("video/");

    if (!isValidExtension) {
      setError(
        `Nieprawidłowy typ pliku. Dozwolone: ${acceptedTypes.join(", ")}`
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Symulacja progressu (prawdziwy progress wymaga XMLHttpRequest lub innej biblioteki)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas uploadu");
      }

      const data = await response.json();
      setProgress(100);

      setTimeout(() => {
        onUploadComplete({
          url: data.url,
          publicId: data.publicId,
          filename: data.filename,
        });
        setSelectedFile(null);
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas uploadu");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-700"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(",")}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {!selectedFile ? (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Przeciągnij plik tutaj lub
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Wybierz plik
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Maksymalny rozmiar: {maxSize} MB
            </p>
            <p className="text-xs text-gray-500">
              Dozwolone typy: {acceptedTypes.join(", ")}
            </p>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 mb-4">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <div className="flex gap-2 justify-center">
              <Button type="button" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Uploading: {progress}%
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
