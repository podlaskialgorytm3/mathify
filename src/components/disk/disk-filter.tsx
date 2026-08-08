"use client";

interface DiskFilterProps {
  value: "ALL" | "COURSE" | "HOMEWORK";
  onChange: (value: "ALL" | "COURSE" | "HOMEWORK") => void;
}

const OPTIONS = [
  { value: "ALL" as const, label: "Wszystkie" },
  { value: "COURSE" as const, label: "Kurs" },
  { value: "HOMEWORK" as const, label: "Praca domowa" },
];

export function DiskFilter({ value, onChange }: DiskFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 font-medium">Filtr:</span>
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            id={`disk-filter-${opt.value.toLowerCase()}`}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              value === opt.value
                ? "bg-white shadow text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
