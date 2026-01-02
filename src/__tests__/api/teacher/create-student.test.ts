import { POST as createStudent } from "@/app/api/teacher/create-student/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
  mockPrismaUser,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

describe("Teacher API - Create Student", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/teacher/create-student", () => {
    it("should create a new student account", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

      const newStudent = mockPrismaUser({
        id: "new-student-id",
        username: "jankowalski",
        role: "STUDENT",
        status: "ACTIVE",
        createdById: "teacher-id",
      });
      (prisma.user.create as jest.Mock).mockResolvedValue(newStudent);

      const request = createMockRequest("/api/teacher/create-student", {
        method: "POST",
        body: {
          firstName: "Jan",
          lastName: "Kowalski",
          username: "jankowalski",
          password: "student123",
        },
      });

      const response = await createStudent(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(data.student).toBeDefined();
      expect(data.student.role).toBe("STUDENT");
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "STUDENT",
            status: "ACTIVE",
            createdById: "teacher-id",
          }),
        })
      );
    });

    it("should reject if username already exists", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaUser({ username: "existinguser" })
      );

      const request = createMockRequest("/api/teacher/create-student", {
        method: "POST",
        body: {
          firstName: "Jan",
          lastName: "Kowalski",
          username: "existinguser",
          password: "password123",
        },
      });

      const response = await createStudent(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should require all necessary fields", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const request = createMockRequest("/api/teacher/create-student", {
        method: "POST",
        body: {
          firstName: "Jan",
          // Missing lastName, username, password
        },
      });

      const response = await createStudent(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should deny access to non-teacher users", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const request = createMockRequest("/api/teacher/create-student", {
        method: "POST",
        body: {
          firstName: "Jan",
          lastName: "Kowalski",
          username: "jankowalski",
          password: "password123",
        },
      });

      const response = await createStudent(request);

      expect(response.status).toBe(401);
    });

    it("should auto-generate email from username", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      const newStudent = mockPrismaUser({
        username: "jankowalski",
        email: "jankowalski@mathify.local",
      });
      (prisma.user.create as jest.Mock).mockResolvedValue(newStudent);

      const request = createMockRequest("/api/teacher/create-student", {
        method: "POST",
        body: {
          firstName: "Jan",
          lastName: "Kowalski",
          username: "jankowalski",
          password: "password123",
        },
      });

      await createStudent(request);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: expect.stringContaining("@mathify.local"),
          }),
        })
      );
    });
  });
});
