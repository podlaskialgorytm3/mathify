/**
 * Skrypt migracyjny: Material 1:N → N:N
 * Wykonuje pełną migrację przez raw SQL, bezpiecznie na żywej bazie.
 *
 * Uruchomienie:
 *   node -r dotenv/config scripts/migrate-materials.js
 *
 * Lub przez ts-node:
 *   npx ts-node scripts/migrate-materials.js
 */

const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Migracja Material 1:N → N:N\n");

  // 1. Dodaj nowe kolumny do Material jeśli nie istnieją
  console.log("1️⃣  Dodaję nowe kolumny do tabeli Material...");

  // Dodaj enum jeśli nie istnieje
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaterialSource') THEN
        CREATE TYPE "MaterialSource" AS ENUM ('COURSE', 'HOMEWORK');
      END IF;
    END $$
  `);

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "source" "MaterialSource" NOT NULL DEFAULT 'COURSE'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "ownerId" TEXT`
  );


  // 2. Utwórz tabelę MaterialSubchapter jeśli nie istnieje
  console.log("2️⃣  Tworzę tabelę MaterialSubchapter...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MaterialSubchapter" (
      "id"           TEXT NOT NULL,
      "materialId"   TEXT NOT NULL,
      "subchapterId" TEXT NOT NULL,
      "order"        INTEGER NOT NULL DEFAULT 0,
      "addedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MaterialSubchapter_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "MaterialSubchapter_materialId_subchapterId_key" UNIQUE ("materialId", "subchapterId"),
      CONSTRAINT "MaterialSubchapter_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MaterialSubchapter_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "Subchapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "MaterialSubchapter_subchapterId_idx" ON "MaterialSubchapter"("subchapterId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "MaterialSubchapter_materialId_idx" ON "MaterialSubchapter"("materialId")`
  );


  // 3. Pobierz materiały ze starym subchapterId
  console.log("3️⃣  Pobieranie istniejących materiałów...");
  const oldMaterials = await prisma.$queryRawUnsafe(`
    SELECT m.id, m."subchapterId", m."order", c."teacherId"
    FROM "Material" m
    JOIN "Subchapter" s ON s.id = m."subchapterId"
    JOIN "Chapter" ch ON ch.id = s."chapterId"
    JOIN "Course" c ON c.id = ch."courseId"
    WHERE m."subchapterId" IS NOT NULL
  `);

  console.log(`   Znaleziono ${oldMaterials.length} materiałów\n`);

  // 4. Migruj każdy materiał
  for (const mat of oldMaterials) {
    // Ustaw ownerId
    await prisma.$executeRawUnsafe(
      `UPDATE "Material" SET "ownerId" = $1 WHERE id = $2`,
      mat.teacherId,
      mat.id
    );

    // Wstaw do MaterialSubchapter
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MaterialSubchapter" (id, "materialId", "subchapterId", "order", "addedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())
       ON CONFLICT ("materialId", "subchapterId") DO NOTHING`,
      mat.id,
      mat.subchapterId,
      mat.order ?? 0
    );

    console.log(`   ✅ Material ${mat.id} → ownerId=${mat.teacherId}`);
  }

  // 5. Ustaw ownerId dla materiałów bez subchapterId (jeśli są)
  const orphans = await prisma.$queryRawUnsafe(
    `SELECT id FROM "Material" WHERE "ownerId" IS NULL`
  );
  if (orphans.length > 0) {
    console.warn(`\n⚠️  ${orphans.length} materiałów bez subchapterId — zostaną pominięte w migracji`);
  }

  console.log("\n✅ Migracja danych zakończona!");
  console.log("\nNastępny krok: npx prisma db push");
}

main()
  .catch((e) => {
    console.error("❌ Błąd:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
