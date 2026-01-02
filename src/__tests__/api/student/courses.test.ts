import { GET as getCourses } from "@/app/api/student/courses/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    courseEnrollment: {
      findMany: jest.fn(),
    },
  },
}));

describe("Student API - Courses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/student/courses", () => {
    it("should return enrolled courses for student", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const mockEnrollments = [
        {
          enrolledAt: new Date(),
          course: {
            id: "course-1",
            title: "Matematyka 1",
            description: "Podstawy matematyki",
            teacher: {
              firstName: "Anna",
              lastName: "Nowak",
            },
            chapters: [
              {
                id: "chapter-1",
                title: "Algebra",
                order: 1,
                _count: {
                  subchapters: 5,
                },
              },
            ],
          },
        },
      ];
      (prisma.courseEnrollment.findMany as jest.Mock).mockResolvedValue(
        mockEnrollments
      );

      const request = createMockRequest("/api/student/courses");
      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.courses).toHaveLength(1);
      expect(data.courses[0].title).toBe("Matematyka 1");
      expect(prisma.courseEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: "student-id" },
        })
      );
    });

    it("should only return visible chapters for student", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const mockEnrollments = [
        {
          enrolledAt: new Date(),
          course: {
            id: "course-1",
            title: "Test Course",
            description: "",
            teacher: {
              firstName: "Test",
              lastName: "Teacher",
            },
            chapters: [], // Only visible chapters should be included
          },
        },
      ];
      (prisma.courseEnrollment.findMany as jest.Mock).mockResolvedValue(
        mockEnrollments
      );

      const request = createMockRequest("/api/student/courses");
      const response = await getCourses(request);

      expect(response.status).toBe(200);
      expect(prisma.courseEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            course: expect.objectContaining({
              select: expect.objectContaining({
                chapters: expect.objectContaining({
                  where: expect.objectContaining({
                    visibility: expect.objectContaining({
                      some: expect.objectContaining({
                        studentId: "student-id",
                        isVisible: true,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
      );
    });

    it("should deny access to non-student users", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const request = createMockRequest("/api/student/courses");
      const response = await getCourses(request);

      expect(response.status).toBe(401);
    });

    it("should deny access to unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/student/courses");
      const response = await getCourses(request);

      expect(response.status).toBe(401);
    });

    it("should return empty array if student has no enrollments", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);
      (prisma.courseEnrollment.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest("/api/student/courses");
      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.courses).toEqual([]);
    });
  });
});
