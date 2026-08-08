import { MaterialCard } from "./material-card";

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

interface DiskGridProps {
  materials: DiskMaterial[];
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export function DiskGrid({ materials, isOwner = true, onDelete }: DiskGridProps) {
  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">Brak materiałów</p>
        <p className="text-gray-400 text-sm mt-1">
          Dodaj materiały do kursów — pojawią się tutaj automatycznie.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {materials.map((m) => (
        <MaterialCard
          key={m.id}
          material={m}
          isOwner={isOwner}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
