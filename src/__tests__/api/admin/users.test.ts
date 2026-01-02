import {
  GET as getUsers,
  POST as createUser,
} from "@/app/api/admin/users/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
  mockPrismaUser,
} from "@/__tests__/utils/test-helpers";

// Mock dependencies
jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Admin API - Users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/users", () => {
    it("should return all users for admin", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockUsers = [
        mockPrismaUser({ id: "user-1", role: "STUDENT" }),
        mockPrismaUser({ id: "user-2", role: "TEACHER" }),
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const request = createMockRequest("/api/admin/users");
      const response = await getUsers(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it("should filter users by role", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockTeachers = [mockPrismaUser({ role: "TEACHER" })];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockTeachers);

      const request = createMockRequest("/api/admin/users", {
        searchParams: { role: "TEACHER" },
      });

      const response = await getUsers(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: "TEACHER",
          }),
        })
      );
    });

    it("should filter users by status", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockPendingUsers = [mockPrismaUser({ status: "PENDING" })];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockPendingUsers);

      const request = createMockRequest("/api/admin/users", {
        searchParams: { status: "PENDING" },
      });

      const response = await getUsers(request);

      expect(response.status).toBe(200);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        })
      );
    });

    it("should deny access to non-admin users", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const request = createMockRequest("/api/admin/users");
      const response = await getUsers(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it("should deny access to unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/admin/users");
      const response = await getUsers(request);

      expect(response.status).toBe(403);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);
      (prisma.user.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = createMockRequest("/api/admin/users");
      const response = await getUsers(request);

      expect(response.status).toBe(500);
    });
  });
});
