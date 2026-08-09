const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Rozpoczynam zoptymalizowaną migrację w SQL...');
  
  try {
    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO "MaterialSubchapter" ("id", "materialId", "subchapterId", "order", "addedAt")
      SELECT gen_random_uuid()::text, "id", "subchapterId", COALESCE("order", 0), NOW()
      FROM "Material"
      WHERE "subchapterId" IS NOT NULL
      ON CONFLICT ("materialId", "subchapterId") DO NOTHING;
    `);
    
    console.log('Gotowe! Wykonano błyskawicznie w ramach jednego zapytania SQL.');
  } catch (e) {
    console.error('Błąd:', e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
