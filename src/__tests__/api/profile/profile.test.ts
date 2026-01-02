import {
  GET as getProfile,
  PUT as updateProfile,
} from "@/app/api/profile/route";
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
      update: jest.fn(),
    },
  },
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("should return user profile for authenticated user", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const mockUser = mockPrismaUser({
        id: "user-id",
        email: "user@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createMockRequest("/api/profile");
      const response = await getProfile(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("user@example.com");
      expect(data.user.password).toBeUndefined(); // Password should not be exposed
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-id" },
        select: expect.objectContaining({
          password: false,
        }),
      });
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

  describe("PUT /api/profile", () => {
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
        method: "PUT",
        body: {
          firstName: "Updated",
          lastName: "Name",
        },
      });

      const response = await updateProfile(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.user.firstName).toBe("Updated");
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("should update password if provided", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const existingUser = mockPrismaUser({
        id: "user-id",
        password: "old_hashed_password",
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("new_hashed_password");
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        password: "new_hashed_password",
      });

      const request = createMockRequest("/api/profile", {
        method: "PUT",
        body: {
          currentPassword: "oldpassword",
          newPassword: "newpassword",
        },
      });

      const response = await updateProfile(request);

      expect(response.status).toBe(200);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "oldpassword",
        "old_hashed_password"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword", 10);
    });

    it("should reject password update with wrong current password", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const existingUser = mockPrismaUser({ id: "user-id" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Wrong password

      const request = createMockRequest("/api/profile", {
        method: "PUT",
        body: {
          currentPassword: "wrongpassword",
          newPassword: "newpassword",
        },
      });

      const response = await updateProfile(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should not allow changing role", async () => {
      const userSession = createMockSession("STUDENT", "user-id");
      (auth as jest.Mock).mockResolvedValue(userSession);

      const existingUser = mockPrismaUser({ id: "user-id", role: "STUDENT" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const request = createMockRequest("/api/profile", {
        method: "PUT",
        body: {
          role: "ADMIN", // Attempting to change role
        },
      });

      const response = await updateProfile(request);

      // Role should not be updated
      expect(prisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "ADMIN",
          }),
        })
      );
    });

    it("should deny access to unauthenticated users", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/profile", {
        method: "PUT",
        body: {
          firstName: "Test",
        },
      });

      const response = await updateProfile(request);

      expect(response.status).toBe(401);
    });
  });
});
