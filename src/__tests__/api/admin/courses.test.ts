import {
  GET as getCourses,
  POST as createCourse,
} from "@/app/api/admin/courses/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
  mockPrismaCourse,
  mockPrismaUser,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Admin API - Courses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/courses", () => {
    it("should return all courses for admin", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockCourses = [
        {
          ...mockPrismaCourse({ id: "course-1" }),
          teacher: mockPrismaUser({ role: "TEACHER" }),
          _count: { chapters: 5, enrollments: 10 },
        },
      ];
      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const request = createMockRequest("/api/admin/courses");
      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.courses).toHaveLength(1);
      expect(prisma.course.findMany).toHaveBeenCalled();
    });

    it("should filter courses by teacher", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const teacherId = "teacher-123";
      const mockCourses = [
        {
          ...mockPrismaCourse({ teacherId }),
          teacher: mockPrismaUser({ id: teacherId }),
          _count: { chapters: 3, enrollments: 5 },
        },
      ];
      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const request = createMockRequest("/api/admin/courses", {
        searchParams: { teacherId },
      });

      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId },
        })
      );
    });

    it("should deny access to non-admin users", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const request = createMockRequest("/api/admin/courses");
      const response = await getCourses(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/admin/courses", () => {
    it("should create a new course", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockTeacher = mockPrismaUser({ id: "teacher-id", role: "TEACHER" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTeacher);

      const newCourse = mockPrismaCourse({
        title: "New Course",
        teacherId: "teacher-id",
      });
      (prisma.course.create as jest.Mock).mockResolvedValue(newCourse);

      const request = createMockRequest("/api/admin/courses", {
        method: "POST",
        body: {
          title: "New Course",
          description: "Course description",
          teacherId: "teacher-id",
        },
      });

      const response = await createCourse(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(data.course).toBeDefined();
      expect(prisma.course.create).toHaveBeenCalled();
    });

    it("should reject if teacher does not exist", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/admin/courses", {
        method: "POST",
        body: {
          title: "New Course",
          teacherId: "nonexistent-id",
        },
      });

      const response = await createCourse(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should reject if user is not a teacher", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockStudent = mockPrismaUser({ role: "STUDENT" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const request = createMockRequest("/api/admin/courses", {
        method: "POST",
        body: {
          title: "New Course",
          teacherId: "student-id",
        },
      });

      const response = await createCourse(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should require title and teacherId", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const request = createMockRequest("/api/admin/courses", {
        method: "POST",
        body: {
          description: "Missing title and teacherId",
        },
      });

      const response = await createCourse(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
