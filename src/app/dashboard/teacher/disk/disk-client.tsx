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
    courseTitle: string;
  }[];
}

interface DiskClientProps {
  initialMaterials: DiskMaterial[];
}

export function DiskClient({ initialMaterials }: DiskClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"ALL" | "COURSE" | "HOMEWORK">("ALL");
  const [materials, setMaterials] = useState<DiskMaterial[]>(initialMaterials);

  const filtered =
    filter === "ALL"
      ? materials
      : materials.filter((m) => m.source === filter);

  const handleDelete = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <DiskFilter value={filter} onChange={setFilter} />
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? "materiał" : "materiałów"}
          </span>
          <DiskViewToggle value={view} onChange={setView} />
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
