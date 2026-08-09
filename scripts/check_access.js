const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    include: {
      teacherAccesses: true
    }
  });
  console.log("Courses:", JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
