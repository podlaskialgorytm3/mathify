"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    courseTitle: string;
  }[];
}

interface DiskListProps {
  materials: DiskMaterial[];
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

function ListRow({
  material,
  isOwner,
  onDelete,
}: {
  material: DiskMaterial;
  isOwner: boolean;
  onDelete?: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Czy na pewno chcesz usunąć "${material.title}"?\n\nMateriał zniknie ze wszystkich ${material.usedInCount} podrozdziałów.`
      )
    )
      return;
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

  const sourceLabel = material.source === "COURSE" ? "Kurs" : "Praca dom.";
  const sourceColor =
    material.source === "COURSE"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {material.type === "PDF" ? (
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
            <span className="font-medium text-gray-900 text-sm">{material.title}</span>
          </div>
          {material.description && (
            <p className="text-xs text-gray-400 mt-0.5 ml-7 line-clamp-1">{material.description}</p>
          )}
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColor}`}>
            {sourceLabel}
          </span>
        </td>
        <td className="py-3 px-4">
          <button
            onClick={() => setShowUsage((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {material.usedInCount === 0
              ? "—"
              : `${material.usedInCount} ${material.usedInCount === 1 ? "podrozdział" : "podrozdziałów"}`}
            {material.usedInCount > 0 && <span className="ml-1">{showUsage ? "▲" : "▼"}</span>}
          </button>
        </td>
        <td className="py-3 px-4 text-xs text-gray-400">
          {new Date(material.createdAt).toLocaleDateString("pl-PL")}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <a
              href={material.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Otwórz ↗
            </a>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
      {showUsage && material.usedIn.length > 0 && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-4 py-2">
            <ul className="text-xs text-gray-600 space-y-0.5 ml-7">
              {material.usedIn.map((u) => (
                <li key={u.subchapterId}>
                  <span className="font-medium">{u.courseTitle}</span>{" / "}{u.subchapterTitle}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}

export function DiskList({ materials, isOwner = true, onDelete }: DiskListProps) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        Brak materiałów do wyświetlenia.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nazwa</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Źródło</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Użycie</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Data</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <ListRow key={m.id} material={m} isOwner={isOwner} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
