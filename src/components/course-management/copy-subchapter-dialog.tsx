"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CourseItem {
  id: string;
  title: string;
  chapters: ChapterItem[];
}

interface ChapterItem {
  id: string;
  title: string;
  subchapters: SubchapterItem[];
}

interface SubchapterItem {
  id: string;
  title: string;
}

interface CopySubchapterDialogProps {
  targetSubchapterId: string;
  onClose: () => void;
}

export function CopySubchapterDialog({
  targetSubchapterId,
  onClose,
}: CopySubchapterDialogProps) {
  const router = useRouter();

  // State for courses list
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cascade selections
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedSubchapterId, setSelectedSubchapterId] = useState("");

  // Derived lists from already-loaded data
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const chapters = selectedCourse?.chapters ?? [];
  const selectedChapter = chapters.find((ch) => ch.id === selectedChapterId);
  const subchapters = selectedChapter?.subchapters ?? [];

  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load all teacher's courses with full chapter/subchapter structure on mount
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        // 1. Get course list
        const listRes = await fetch("/api/teacher/courses");
        const listData = await listRes.json();
        const courseList: { id: string; title: string }[] =
          listData.courses ?? [];

        // 2. For each course, load chapters+subchapters
        const full: CourseItem[] = await Promise.all(
          courseList.map(async (c) => {
            try {
              const detailRes = await fetch(`/api/teacher/courses/${c.id}`);
              const detailData = await detailRes.json();
              const chapters: ChapterItem[] = (
                detailData.course?.chapters ?? []
              ).map((ch: any) => ({
                id: ch.id,
                title: ch.title,
                subchapters: (ch.subchapters ?? []).map((s: any) => ({
                  id: s.id,
                  title: s.title,
                })),
              }));
              return { id: c.id, title: c.title, chapters };
            } catch {
              return { id: c.id, title: c.title, chapters: [] };
            }
          })
        );

        setCourses(full);
      } catch {
        setError("Nie udało się załadować kursów");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleCopy = async () => {
    if (!selectedSubchapterId) return;
    if (selectedSubchapterId === targetSubchapterId) {
      setError("Nie można kopiować podrozdziału do samego siebie");
      return;
    }
    setCopying(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/subchapters/${targetSubchapterId}/copy-from/${selectedSubchapterId}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd kopiowania");
      setSuccess(
        data.copied === 0
          ? "Źródłowy podrozdział nie ma materiałów."
          : `Skopiowano ${data.copied} materiałów!`
      );
      router.refresh();
      setTimeout(onClose, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd kopiowania");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Kopiuj materiały z podrozdziału
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Wszystkie materiały ze źródłowego podrozdziału zostaną skopiowane
          (jako referencje) do bieżącego podrozdziału — bez ponownego uploadu.
        </p>

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

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Ładowanie kursów...
          </p>
        ) : (
          <div className="space-y-3">
            {/* Course */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Kurs źródłowy
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedChapterId("");
                  setSelectedSubchapterId("");
                }}
                className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">— Wybierz kurs —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Rozdział
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => {
                  setSelectedChapterId(e.target.value);
                  setSelectedSubchapterId("");
                }}
                disabled={!selectedCourseId || chapters.length === 0}
                className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">— Wybierz rozdział —</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Subchapter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Podrozdział źródłowy
              </label>
              <select
                value={selectedSubchapterId}
                onChange={(e) => setSelectedSubchapterId(e.target.value)}
                disabled={!selectedChapterId || subchapters.length === 0}
                className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">— Wybierz podrozdział —</option>
                {subchapters
                  .filter((s) => s.id !== targetSubchapterId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
              </select>
              {selectedChapterId && subchapters.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Ten rozdział nie ma podrozdziałów.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            id="copy-subchapter-confirm"
            onClick={handleCopy}
            disabled={!selectedSubchapterId || copying || loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copying ? "Kopiuję..." : "Skopiuj materiały"}
          </button>
        </div>
      </div>
    </div>
  );
}
