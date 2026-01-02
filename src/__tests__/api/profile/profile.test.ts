import {
  GET as getProfile,
  PATCH as updateProfile,
} from "@/app/api/profile/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
      update: jest.fn(),
    },
  },
}));

describe("Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("should return user profile for authenticated user", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const mockUser = {
        id: "user-id",
        email: "user@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        role: "STUDENT",
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createMockRequest("/api/profile");
      const response = await getProfile(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(data.email).toBe("user@example.com");
      expect(data.password).toBeUndefined(); // Password should not be exposed
    });

    it("should deny access to unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/profile");
      const response = await getProfile(request);

      expect(response.status).toBe(401);
    });

    it("should return 404 if user not found", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/profile");
      const response = await getProfile(request);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/profile", () => {
    it("should update user profile", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const existingUser = mockPrismaUser({ id: "user-id" });
      const updatedUser = {
        ...existingUser,
        firstName: "Updated",
        lastName: "Name",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const request = createMockRequest("/api/profile", {
        method: "PATCH",
        body: {
          firstName: "Updated",
          lastName: "Name",
          username: "testuser",
        },
      });

      const response = await updateProfile(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.user.firstName).toBe("Updated");
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("should not allow changing role", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const existingUser = mockPrismaUser({ id: "user-id", role: "STUDENT" });
      const updatedUser = { ...existingUser, role: "STUDENT" }; // Role stays the same

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const request = createMockRequest("/api/profile", {
        method: "PATCH",
        body: {
          firstName: "Test",
          lastName: "User",
          username: "testuser",
          role: "ADMIN", // Attempting to change role
        },
      });

      const response = await updateProfile(request);

      // Role should not be updated - check that update was called without role in data
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            role: "ADMIN",
          }),
        })
      );
    });

    it("should deny access to unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/profile", {
        method: "PATCH",
        body: {
          firstName: "Test",
        },
      });

      const response = await updateProfile(request);

      expect(response.status).toBe(401);
    });
  });
});
