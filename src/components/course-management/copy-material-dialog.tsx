"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DiskMaterial {
  id: string;
  title: string;
  type: "PDF" | "LINK";
  source: "COURSE" | "HOMEWORK";
  usedInCount: number;
}

interface CopyMaterialDialogProps {
  targetSubchapterId: string;
  onClose: () => void;
}

export function CopyMaterialDialog({
  targetSubchapterId,
  onClose,
}: CopyMaterialDialogProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<DiskMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "COURSE" | "HOMEWORK">("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/teacher/disk")
      .then((r) => r.json())
      .then((d) => setMaterials(d.materials || []))
      .catch(() => setError("Błąd ładowania materiałów"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter((m) => {
    const matchesFilter = filter === "ALL" || m.source === filter;
    const matchesSearch = m.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleLink = async () => {
    if (!selected) return;
    setLinking(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/subchapters/${targetSubchapterId}/materials/link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId: selected }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Materiał został dodany do podrozdziału!");
      router.refresh();
      setTimeout(onClose, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd dodawania");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Dodaj istniejący materiał
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Wybierz materiał ze swojego Dysku. Zostanie dodany do podrozdziału
          jako referencja — bez re-uploadu pliku.
        </p>

        {/* Search + filter */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Szukaj..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "ALL" | "COURSE" | "HOMEWORK")
            }
            className="border border-gray-300 rounded-lg text-sm px-3 py-2"
          >
            <option value="ALL">Wszystkie</option>
            <option value="COURSE">Kurs</option>
            <option value="HOMEWORK">Praca domowa</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3">
            {success}
          </p>
        )}

        {/* Materials list */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 min-h-0">
          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Ładowanie...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Brak materiałów
            </div>
          )}
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id === selected ? null : m.id)}
              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 transition-colors ${
                selected === m.id ? "bg-blue-50 border-l-2 border-blue-600" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  m.type === "PDF" ? "bg-red-50" : "bg-green-50"
                }`}
              >
                {m.type === "PDF" ? (
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {m.title}
                </p>
                <p className="text-xs text-gray-400">
                  {m.source === "COURSE" ? "Kurs" : "Praca domowa"} ·{" "}
                  {m.usedInCount} {m.usedInCount === 1 ? "podrozdział" : "podrozdziałów"}
                </p>
              </div>
              {selected === m.id && (
                <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            id="copy-material-confirm"
            onClick={handleLink}
            disabled={!selected || linking}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {linking ? "Dodaję..." : "Dodaj do podrozdziału"}
          </button>
        </div>
      </div>
    </div>
  );
}
