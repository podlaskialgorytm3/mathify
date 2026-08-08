import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DiskClient } from "./disk-client";

export const metadata = {
  title: "Dysk — Mathify",
  description: "Wszystkie Twoje materiały edukacyjne w jednym miejscu",
};

export default async function TeacherDiskPage() {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Pobierz materiały nauczyciela z relacjami (Server Component)
  const materials = await prisma.material.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
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
  });

  const serialized = materials.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type,
    content: m.content,
    source: m.source,
    createdAt: m.createdAt.toISOString(),
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dysk</h1>
          <p className="text-sm text-gray-500">
            Wszystkie Twoje materiały edukacyjne
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{serialized.length}</div>
          <div className="text-sm text-gray-500">Wszystkie materiały</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700">
            {serialized.filter((m) => m.source === "COURSE").length}
          </div>
          <div className="text-sm text-gray-500">Materiały kursu</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700">
            {serialized.filter((m) => m.source === "HOMEWORK").length}
          </div>
          <div className="text-sm text-gray-500">Prace domowe</div>
        </div>
      </div>

      {/* Client interactive part */}
      <DiskClient initialMaterials={serialized} />
    </div>
  );
}
