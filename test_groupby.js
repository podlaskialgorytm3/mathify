const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const views = await prisma.materialView.groupBy({
      by: ['materialId'],
      where: {
        materialId: { in: [] },
        studentId: '123',
      },
      _count: {
        _all: true,
      },
    });
    console.log('SUCCESS', views);
  } catch (e) {
    console.error('ERROR', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
