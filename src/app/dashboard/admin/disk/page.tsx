import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DiskGrid } from "@/components/disk/disk-grid";
import { DiskList } from "@/components/disk/disk-list";

export const metadata = {
  title: "Dysk (Admin) — Mathify",
  description: "Przegląd wszystkich materiałów w systemie",
};

export default async function AdminDiskPage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; source?: string; view?: string }>;
}) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { teacherId, source, view = "list" } = await searchParams;

  const where: Record<string, unknown> = {};
  if (teacherId) where.ownerId = teacherId;
  if (source === "COURSE" || source === "HOMEWORK") where.source = source;

  const [materials, teachers] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        subchapters: {
          include: {
            subchapter: {
              include: {
                chapter: {
                  include: {
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const serialized = materials.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type,
    content: m.content,
    source: m.source,
    createdAt: m.createdAt.toISOString(),
    ownerName: `${m.owner.firstName} ${m.owner.lastName}`,
    usedInCount: m.subchapters.length,
    usedIn: m.subchapters.map((ms) => ({
      subchapterId: ms.subchapterId,
      subchapterTitle: ms.subchapter.title,
      chapterId: ms.subchapter.chapterId,
      courseId: ms.subchapter.chapter.courseId,
      courseTitle: ms.subchapter.chapter.course.title,
      order: ms.order,
    })),
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dysk — Widok Admina</h1>
          <p className="text-sm text-gray-500">
            Wszystkie materiały w systemie ({materials.length} łącznie)
          </p>
        </div>
      </div>

      {/* Filters (server-side via URL params) */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6 bg-white border border-gray-200 rounded-xl p-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nauczyciel</label>
          <select
            name="teacherId"
            defaultValue={teacherId || ""}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2"
          >
            <option value="">Wszyscy</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Źródło</label>
          <select
            name="source"
            defaultValue={source || ""}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2"
          >
            <option value="">Wszystkie</option>
            <option value="COURSE">Kurs</option>
            <option value="HOMEWORK">Praca domowa</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Widok</label>
          <select
            name="view"
            defaultValue={view}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2"
          >
            <option value="list">Lista</option>
            <option value="grid">Kafelki</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filtruj
          </button>
        </div>
      </form>

      {/* Read-only view — admin cannot delete */}
      {view === "grid" ? (
        <DiskGrid materials={serialized} isOwner={false} />
      ) : (
        <DiskList materials={serialized} isOwner={false} />
      )}
    </div>
  );
}
