import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Rozpoczynam migrację danych materiałów...');
  
  // Pobierz wszystkie materiały, które mają przypisany subchapterId
  const materials = await prisma.material.findMany({
    where: {
      subchapterId: {
        not: null
      }
    }
  });

  console.log(`Znaleziono ${materials.length} materiałów do zmigrowania.`);

  let successCount = 0;
  
  for (const material of materials) {
    if (material.subchapterId) {
      try {
        await prisma.materialSubchapter.upsert({
          where: {
            materialId_subchapterId: {
              materialId: material.id,
              subchapterId: material.subchapterId
            }
          },
          update: {},
          create: {
            materialId: material.id,
            subchapterId: material.subchapterId,
            order: material.order || 0
          }
        });
        successCount++;
      } catch (e) {
        console.error(`Błąd przy migracji materiału ${material.id}:`, e);
      }
    }
  }

  console.log(`Zakończono! Zmigrowano pomyślnie: ${successCount}/${materials.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
