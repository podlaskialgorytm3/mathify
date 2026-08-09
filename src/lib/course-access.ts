import { prisma } from "@/lib/prisma";

export async function verifyCourseEditAccess(courseId: string, teacherId: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacherAccesses: {
        where: { teacherId }
      }
    }
  });

  if (!course) return false;

  // 1. Owner
  if (course.teacherId === teacherId) return true;

  // 2. OPEN_SOURCE via teacher accesses
  if (course.teacherAccesses.some((a) => a.accessType === "OPEN_SOURCE")) return true;

  // 3. OPEN_SOURCE via PUBLIC visibility
  if (course.visibility === "PUBLIC" && course.publicAccessType === "OPEN_SOURCE") return true;

  return false;
}
