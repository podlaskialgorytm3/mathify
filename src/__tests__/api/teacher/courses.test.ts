import {
  GET as getCourses,
  POST as createCourse,
} from "@/app/api/teacher/courses/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
  mockPrismaCourse,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Teacher API - Courses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/teacher/courses", () => {
    it("should return courses for authenticated teacher", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const mockCourses = [
        {
          ...mockPrismaCourse({ teacherId: "teacher-id" }),
          _count: {
            chapters: 5,
            enrollments: 15,
          },
        },
      ];
      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const request = createMockRequest("/api/teacher/courses");
      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.courses).toHaveLength(1);
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: "teacher-id" },
        })
      );
    });

    it("should deny access to non-teacher users", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const request = createMockRequest("/api/teacher/courses");
      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should deny access to unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/teacher/courses");
      const response = await getCourses(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/teacher/courses", () => {
    it("should create a new course for teacher", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const newCourse = mockPrismaCourse({
        title: "Matematyka Podstawowa",
        teacherId: "teacher-id",
      });
      (prisma.course.create as jest.Mock).mockResolvedValue(newCourse);

      const request = createMockRequest("/api/teacher/courses", {
        method: "POST",
        body: {
          title: "Matematyka Podstawowa",
          description: "Kurs matematyki",
        },
      });

      const response = await createCourse(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(data.course).toBeDefined();
      expect(data.course.title).toBe("Matematyka Podstawowa");
      expect(prisma.course.create).toHaveBeenCalled();
    });

    it("should require course title", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const request = createMockRequest("/api/teacher/courses", {
        method: "POST",
        body: {
          description: "Missing title",
        },
      });

      const response = await createCourse(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should handle database errors", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);
      (prisma.course.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = createMockRequest("/api/teacher/courses", {
        method: "POST",
        body: {
          title: "Test Course",
        },
      });

      const response = await createCourse(request);

      expect(response.status).toBe(500);
    });
  });
});
