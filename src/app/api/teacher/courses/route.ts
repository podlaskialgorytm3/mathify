import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { teacherId: session.user.id },
          {
            teacherAccesses: {
              some: { teacherId: session.user.id, addedToAccount: true },
            },
          },
        ],
      },
      include: {
        teacherAccesses: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: {
          select: {
            chapters: true,
            enrollments: {
              where: {
                student: {
                  createdById: session.user.id
                }
              }
            },
          },
        },
        chapters: {
          include: {
            _count: {
              select: {
                subchapters: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedCourses = courses.map((course) => {
      let computedAccessType = "OWNER";
      if (course.teacherId !== session.user.id) {
        const access = course.teacherAccesses.find(
          (a) => a.teacherId === session.user.id
        );
        if (access) {
          computedAccessType = access.accessType;
        } else if (course.visibility === "PUBLIC") {
          computedAccessType = course.publicAccessType || "READ_ONLY";
        }
      }
      return { ...course, computedAccessType };
    });

    const sharedCourses = await prisma.course.findMany({
      where: {
        teacherId: { not: session.user.id },
        isSharedCopy: false,
        OR: [
          { visibility: "PUBLIC" },
          { teacherAccesses: { some: { teacherId: session.user.id } } },
        ],
      },
      include: {
        teacher: {
          select: { firstName: true, lastName: true },
        },
        teacherAccesses: {
          where: { teacherId: session.user.id },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedSharedCourses = sharedCourses.map((course) => {
      let computedAccessType = course.publicAccessType || "READ_ONLY";
      const myAccess = course.teacherAccesses[0];
      if (myAccess) {
        computedAccessType = myAccess.accessType;
      }
      return {
        ...course,
        computedAccessType,
        addedToAccount: myAccess?.addedToAccount || false,
      };
    });

    return NextResponse.json({
      courses: mappedCourses,
      sharedCourses: mappedSharedCourses,
    });
  } catch (error) {
    console.error("Error fetching teacher courses:", error);
    return NextResponse.json(
      { error: "Błąd pobierania kursów" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, visibility, publicAccessType, sharedWithUsers } =
      body;

    if (!title) {
      return NextResponse.json(
        { error: "Tytuł jest wymagany" },
        { status: 400 }
      );
    }

    const courseData: any = {
      title,
      description: description || null,
      teacherId: session.user.id,
      visibility: visibility || "PROTECTED",
      publicAccessType: visibility === "PUBLIC" ? publicAccessType : null,
    };

    if (
      visibility === "PROTECTED" &&
      sharedWithUsers &&
      sharedWithUsers.length > 0
    ) {
      courseData.teacherAccesses = {
        create: sharedWithUsers.map((user: any) => ({
          teacherId: user.id,
          accessType: user.accessType,
          addedToAccount: false,
        })),
      };
    }

    const course = await prisma.course.create({
      data: courseData,
      include: {
        teacherAccesses: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: {
          select: {
            chapters: true,
            enrollments: {
              where: {
                student: {
                  createdById: session.user.id
                }
              }
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Kurs został utworzony",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Błąd tworzenia kursu" },
      { status: 500 }
    );
  }
}
