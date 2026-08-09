"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DiskMaterial {
  id: string;
  title: string;
  description: string | null;
  type: "PDF" | "LINK";
  content: string;
  source: "COURSE" | "HOMEWORK";
  createdAt: string;
  usedInCount: number;
  usedIn: {
    subchapterId: string;
    subchapterTitle: string;
    chapterId: string;
    chapterTitle: string;
    courseId: string;
    courseTitle: string;
  }[];
}

interface MaterialCardProps {
  material: DiskMaterial;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export function MaterialCard({
  material,
  isOwner = true,
  onDelete,
}: MaterialCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć "${material.title}"?\n\nMateriał zniknie ze wszystkich ${material.usedInCount} podrozdziałów.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/materials/${material.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete?.(material.id);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Błąd usuwania");
      }
    } finally {
      setDeleting(false);
    }
  };

  const isPdf = material.type === "PDF";
  const sourceLabel = material.source === "COURSE" ? "Kurs" : "Praca domowa";
  const sourceColor =
    material.source === "COURSE"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Icon + type */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? "bg-red-50" : "bg-green-50"}`}>
            {isPdf ? (
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColor}`}>
            {sourceLabel}
          </span>
        </div>
        {isOwner && (
          <button
            id={`material-delete-${material.id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Usuń materiał"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Title + description */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
          {material.title}
        </h3>
        {material.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {material.description}
          </p>
        )}
      </div>

      {/* Usage info */}
      <button
        onClick={() => setShowUsage((v) => !v)}
        className="text-xs text-blue-600 hover:text-blue-800 text-left"
      >
        {material.usedInCount === 0
          ? "Nieprzypisany"
          : `Używany w ${material.usedInCount} ${material.usedInCount === 1 ? "podrozdziale" : "podrozdziałach"}`}
        {material.usedInCount > 0 && (
          <span className="ml-1">{showUsage ? "▲" : "▼"}</span>
        )}
      </button>

      {showUsage && material.usedIn.length > 0 && (
        <ul className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 space-y-1">
          {material.usedIn.map((u) => (
            <li key={u.subchapterId} className="truncate">
              <span className="font-medium">{u.courseTitle}</span>
              {" / "}
              {u.chapterTitle}
              {" / "}
              {u.subchapterTitle}
            </li>
          ))}
        </ul>
      )}

      {/* Date + link */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {new Date(material.createdAt).toLocaleDateString("pl-PL")}
        </span>
        {isPdf ? (
          <a
            href={material.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Otwórz PDF ↗
          </a>
        ) : (
          <a
            href={material.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate max-w-[140px]"
          >
            Otwórz link ↗
          </a>
        )}
      </div>
    </div>
  );
}
