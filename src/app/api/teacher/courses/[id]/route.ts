import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCourseEditAccess } from "@/lib/course-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const course = await prisma.course.findFirst({
      where: {
        id,
        OR: [
          { teacherId: session.user.id },
          { visibility: "PUBLIC" },
          { teacherAccesses: { some: { teacherId: session.user.id } } },
        ],
      },
      include: {
        teacherAccesses: true,
        aiPromptTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        chapters: {
          include: {
            subchapters: {
              include: {
                materialSubchapters: {
                  include: {
                    material: {
                      include: {
                        latexDocument: {
                          select: { id: true },
                        },
                      },
                    },
                  },
                  orderBy: {
                    order: "asc",
                  },
                },
                _count: {
                  select: {
                    materialSubchapters: true,
                    submissions: true,
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
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
        enrollments: {
          where: {
            student: {
              createdById: session.user.id
            }
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
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

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({ course: { ...course, computedAccessType } });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Błąd pobierania kursu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, aiPromptTemplateId, visibility, publicAccessType, sharedWithUsers } = body;

    // Check if course exists and teacher has edit access
    const existingCourse = await prisma.course.findUnique({
      where: {
        id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Kurs nie istnieje" },
        { status: 404 }
      );
    }

    const hasAccess = await verifyCourseEditAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Brak uprawnień do edycji tego kursu" },
        { status: 403 }
      );
    }

    // If aiPromptTemplateId is provided, verify it belongs to the teacher
    if (aiPromptTemplateId) {
      const template = await prisma.aIPromptTemplate.findFirst({
        where: {
          id: aiPromptTemplateId,
          teacherId: session.user.id,
        },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Szablon nie istnieje lub nie masz do niego dostępu" },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (aiPromptTemplateId !== undefined) {
      updateData.aiPromptTemplateId = aiPromptTemplateId || null;
    }
    if (visibility) updateData.visibility = visibility;
    if (visibility === "PUBLIC" && publicAccessType) {
      updateData.publicAccessType = publicAccessType;
    }

    if (visibility === "PROTECTED" && sharedWithUsers) {
      const newIds = sharedWithUsers.map((u: any) => u.id);
      updateData.teacherAccesses = {
        deleteMany: {
          teacherId: { notIn: newIds },
        },
        upsert: sharedWithUsers.map((u: any) => ({
          where: { courseId_teacherId: { courseId: id, teacherId: u.id } },
          create: { teacherId: u.id, accessType: u.accessType, addedToAccount: false },
          update: { accessType: u.accessType },
        })),
      };
    } else if (visibility && visibility !== "PROTECTED") {
      updateData.teacherAccesses = {
        deleteMany: {}, // Clear relations if changed to something else
      };
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        teacherAccesses: {
          include: { teacher: { select: { id: true, firstName: true, lastName: true } } },
        },
        aiPromptTemplate: {
          select: {
            id: true,
            name: true,
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
      message: "Kurs zaktualizowany",
      course,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji kursu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    // Check if course belongs to teacher
    const course = await prisma.course.findUnique({
      where: {
        id,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Delete course (cascade will remove related data)
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Kurs został usunięty",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Błąd usuwania kursu" }, { status: 500 });
  }
}
