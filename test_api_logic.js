const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // We will just pick the first enrolled student and course
    const enrollment = await prisma.courseEnrollment.findFirst({
      include: {
        student: true,
        course: true,
      }
    });

    if (!enrollment) {
      console.log('No enrollments found to test with.');
      return;
    }

    const studentId = enrollment.studentId;
    const courseId = enrollment.courseId;

    console.log(`Testing with studentId=${studentId}, courseId=${courseId}`);

    // Pobierz dane ucznia
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // Pobierz rozdziały z widocznością dla tego ucznia
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId: courseId,
      },
      select: {
        id: true,
        title: true,
        order: true,
        visibility: {
          where: {
            studentId: studentId,
          },
          select: {
            id: true,
            isVisible: true,
            unlockedAt: true,
          },
        },
        subchapters: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            title: true,
            order: true,
            allowSubmissions: true,
            visibility: {
              where: {
                studentId: studentId,
              },
              select: {
                id: true,
                isVisible: true,
                unlockedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    // Pobierz liczbę wyświetleń dla każdego podrozdziału
    const subchapterIds = chapters.flatMap((c) =>
      c.subchapters.map((s) => s.id),
    );

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

    const viewsCountPerSubchapter = {};
    for (const ms of materialSubchapters) {
      viewsCountPerSubchapter[ms.subchapterId] =
        (viewsCountPerSubchapter[ms.subchapterId] || 0) +
        (ms.material?._count?.views || 0);
    }

    // Przekształć dane do bardziej czytelnego formatu
    const formattedChapters = chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      visibility: chapter.visibility[0] || null,
      subchapters: chapter.subchapters.map((subchapter) => ({
        id: subchapter.id,
        title: subchapter.title,
        order: subchapter.order,
        allowSubmissions: subchapter.allowSubmissions,
        visibility: subchapter.visibility[0] || null,
        viewsCount: viewsCountPerSubchapter[subchapter.id] || 0,
      })),
    }));

    console.log('SUCCESS!');
  } catch (e) {
    console.error('ERROR in API logic:');
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
