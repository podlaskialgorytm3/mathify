"use client";

import { useState } from "react";
import { DiskViewToggle } from "@/components/disk/disk-view-toggle";
import { DiskFilter } from "@/components/disk/disk-filter";
import { DiskGrid } from "@/components/disk/disk-grid";
import { DiskList } from "@/components/disk/disk-list";

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

interface DiskClientProps {
  initialMaterials: DiskMaterial[];
}

export function DiskClient({ initialMaterials }: DiskClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"ALL" | "COURSE" | "HOMEWORK">("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [chapterFilter, setChapterFilter] = useState<string>("ALL");
  const [subchapterFilter, setSubchapterFilter] = useState<string>("ALL");
  const [materials, setMaterials] = useState<DiskMaterial[]>(initialMaterials);

  // Extract unique courses
  const coursesMap = new Map();
  materials.forEach((m) => {
    m.usedIn.forEach((u) => {
      if (!coursesMap.has(u.courseId)) {
        coursesMap.set(u.courseId, u.courseTitle);
      }
    });
  });
  const courses = Array.from(coursesMap.entries()).map(([id, title]) => ({ id, title }));

  // Extract chapters for selected course
  const chaptersMap = new Map();
  if (courseFilter !== "ALL") {
    materials.forEach((m) => {
      m.usedIn.forEach((u) => {
        if (u.courseId === courseFilter && !chaptersMap.has(u.chapterId)) {
          chaptersMap.set(u.chapterId, u.chapterTitle);
        }
      });
    });
  }
  const chapters = Array.from(chaptersMap.entries()).map(([id, title]) => ({ id, title }));

  // Extract subchapters for selected chapter
  const subchaptersMap = new Map();
  if (chapterFilter !== "ALL") {
    materials.forEach((m) => {
      m.usedIn.forEach((u) => {
        if (u.chapterId === chapterFilter && !subchaptersMap.has(u.subchapterId)) {
          subchaptersMap.set(u.subchapterId, u.subchapterTitle);
        }
      });
    });
  }
  const subchapters = Array.from(subchaptersMap.entries()).map(([id, title]) => ({ id, title }));

  const filtered = materials.filter((m) => {
    if (filter !== "ALL" && m.source !== filter) return false;
    
    if (courseFilter !== "ALL") {
      const isInCourse = m.usedIn.some((u) => u.courseId === courseFilter);
      if (!isInCourse) return false;
      
      if (chapterFilter !== "ALL") {
        const isInChapter = m.usedIn.some((u) => u.courseId === courseFilter && u.chapterId === chapterFilter);
        if (!isInChapter) return false;
        
        if (subchapterFilter !== "ALL") {
          const isInSubchapter = m.usedIn.some(
            (u) => u.chapterId === chapterFilter && u.subchapterId === subchapterFilter
          );
          if (!isInSubchapter) return false;
        }
      }
    }
    
    return true;
  });

  const handleDelete = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DiskFilter value={filter} onChange={setFilter} />
          
          <div className="flex items-center gap-3 sm:ml-auto">
            <span className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? "materiał" : "materiałów"}
            </span>
            <DiskViewToggle value={view} onChange={setView} />
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="text-sm text-gray-500 font-medium">Kurs:</label>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setChapterFilter("ALL");
                setSubchapterFilter("ALL");
              }}
              className="text-sm bg-white border border-gray-200 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:max-w-[200px] truncate"
            >
              <option value="ALL">Wszystkie kursy</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {courseFilter !== "ALL" && chapters.length > 0 && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label className="text-sm text-gray-500 font-medium">Rozdział:</label>
              <select
                value={chapterFilter}
                onChange={(e) => {
                  setChapterFilter(e.target.value);
                  setSubchapterFilter("ALL");
                }}
                className="text-sm bg-white border border-gray-200 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:max-w-[200px] truncate"
              >
                <option value="ALL">Wszystkie rozdziały</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          {chapterFilter !== "ALL" && subchapters.length > 0 && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label className="text-sm text-gray-500 font-medium">Podrozdział:</label>
              <select
                value={subchapterFilter}
                onChange={(e) => setSubchapterFilter(e.target.value)}
                className="text-sm bg-white border border-gray-200 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:max-w-[200px] truncate"
              >
                <option value="ALL">Wszystkie podrozdziały</option>
                {subchapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        <DiskGrid materials={filtered} isOwner={true} onDelete={handleDelete} />
      ) : (
        <DiskList materials={filtered} isOwner={true} onDelete={handleDelete} />
      )}
    </div>
  );
}
