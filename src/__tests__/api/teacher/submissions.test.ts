import { GET as getSubmissions } from "@/app/api/teacher/submissions/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
  mockPrismaCourse,
  mockPrismaSubmission,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("Teacher API - Submissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/teacher/submissions", () => {
    it("should return submissions for teacher courses", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const mockCourses = [
        mockPrismaCourse({ id: "course-1", teacherId: "teacher-id" }),
      ];
      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const mockSubmissions = [
        {
          ...mockPrismaSubmission(),
          student: {
            id: "student-1",
            firstName: "Jan",
            lastName: "Kowalski",
            email: "jan@example.com",
          },
          subchapter: {
            title: "Algebra",
            chapter: {
              title: "Matematyka",
              course: {
                id: "course-1",
                title: "Matematyka 1",
              },
            },
          },
          tasks: [],
        },
      ];
      (prisma.submission.findMany as jest.Mock).mockResolvedValue(
        mockSubmissions
      );
      (prisma.submission.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest("/api/teacher/submissions");
      const response = await getSubmissions(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.submissions).toHaveLength(1);
      expect(data.stats).toBeDefined();
    });

    it("should filter submissions by status", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);
      (prisma.course.findMany as jest.Mock).mockResolvedValue([
        mockPrismaCourse({ id: "course-1" }),
      ]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest("/api/teacher/submissions", {
        searchParams: { status: "PENDING" },
      });

      const response = await getSubmissions(request);

      expect(response.status).toBe(200);
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        })
      );
    });

    it("should filter submissions by course", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const courseId = "course-123";
      (prisma.course.findMany as jest.Mock).mockResolvedValue([
        mockPrismaCourse({ id: courseId }),
      ]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest("/api/teacher/submissions", {
        searchParams: { courseId },
      });

      const response = await getSubmissions(request);

      expect(response.status).toBe(200);
    });

    it("should deny access to non-teacher users", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const request = createMockRequest("/api/teacher/submissions");
      const response = await getSubmissions(request);

      expect(response.status).toBe(401);
    });

    it("should return empty submissions if teacher has no courses", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest("/api/teacher/submissions");
      const response = await getSubmissions(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.submissions).toEqual([]);
    });
  });
});
