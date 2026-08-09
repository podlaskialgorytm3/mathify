/**
 * Skrypt migracyjny: Material 1:N → N:N
 *
 * Co robi:
 * 1. Dodaje tymczasową kolumnę `ownerId` i `source` do istniejących Material (raw SQL)
 * 2. Wypełnia ownerId przez łańcuch Material → Subchapter → Chapter → Course → teacherId
 * 3. Tworzy tabelę MaterialSubchapter i przenosi stare przypisania subchapterId + order
 * 4. Usuwa stare kolumny subchapterId i order z Material
 *
 * Uruchomienie: npx ts-node --project tsconfig.scripts.json scripts/migrate-materials-to-n-to-n.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("🚀 Rozpoczynam migrację Material 1:N → N:N...\n");

  // Krok 1: Pobierz wszystkie materiały ze starym subchapterId i order (raw SQL)
  const oldMaterials = await prisma.$queryRaw<
    Array<{
      id: string;
      subchapterId: string;
      order: number;
    }>
  >`SELECT id, "subchapterId", "order" FROM "Material"`;

  console.log(`📦 Znaleziono ${oldMaterials.length} materiałów do migracji`);

  // Krok 2: Dla każdego materiału wylicz ownerId
  for (const mat of oldMaterials) {
    const subchapter = await prisma.subchapter.findUnique({
      where: { id: mat.subchapterId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!subchapter) {
      console.warn(
        `⚠️  Subchapter ${mat.subchapterId} nie istnieje dla Material ${mat.id} — pomijam`
      );
      continue;
    }

    const teacherId = subchapter.chapter.course.teacherId;

    // Ustaw ownerId przez raw SQL (schema jeszcze nie ma tych kolumn w kliencie TS)
    await prisma.$executeRaw`
      UPDATE "Material"
      SET "ownerId" = ${teacherId}
      WHERE id = ${mat.id}
    `;

    // Wstaw wiersz do MaterialSubchapter
    await prisma.$executeRaw`
      INSERT INTO "MaterialSubchapter" (id, "materialId", "subchapterId", "order", "addedAt")
      VALUES (
        gen_random_uuid()::text,
        ${mat.id},
        ${mat.subchapterId},
        ${mat.order},
        NOW()
      )
      ON CONFLICT ("materialId", "subchapterId") DO NOTHING
    `;

    console.log(
      `✅ Material ${mat.id}: ownerId=${teacherId}, sub=${mat.subchapterId}`
    );
  }

  console.log("\n✅ Migracja zakończona pomyślnie!");
}

main()
  .catch((e) => {
    console.error("❌ Błąd migracji:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
