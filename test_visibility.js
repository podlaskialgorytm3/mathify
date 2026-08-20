const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const studentId = 'cm01r32x10008f1bshc0q2yq7'; 
    const subchapterIds = [];

    const materialSubchapters = await prisma.materialSubchapter.findMany({
      where: {
        subchapterId: { in: subchapterIds },
      },
      select: {
        subchapterId: true,
        material: {
          select: {
            _count: {
              select: {
                views: {
                  where: { studentId },
                },
              },
            },
          },
        },
      },
    });

    console.log('Success with empty array', materialSubchapters);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
