const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const studentId = '123';
    const res = await prisma.materialSubchapter.findMany({
      select: {
        material: {
          select: {
            _count: {
              select: {
                views: {
                  where: { studentId }
                }
              }
            }
          }
        }
      }
    });
    console.log('Result type:', typeof res[0]?.material._count.views);
    console.log('Result:', res);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
