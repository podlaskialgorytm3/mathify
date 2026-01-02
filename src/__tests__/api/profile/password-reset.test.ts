import { POST as requestPasswordReset } from "@/app/api/profile/request-password-reset/route";
import { POST as resetPassword } from "@/app/api/profile/reset-password/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createMockRequest,
  getResponseBody,
  mockPrismaUser,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("@/lib/email", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

describe("Profile API - Password Reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/profile/request-password-reset", () => {
    it("should create password reset token and send email", async () => {
      const mockUser = mockPrismaUser({ email: "user@example.com" });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const mockToken = {
        id: "token-id",
        userId: mockUser.id,
        token: "reset-token-123",
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        used: false,
        newEmail: null,
      };
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue(
        mockToken
      );

      const request = createMockRequest("/api/profile/request-password-reset", {
        method: "POST",
        body: {
          email: "user@example.com",
        },
      });

      const response = await requestPasswordReset(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(prisma.verificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            type: "PASSWORD_RESET",
          }),
        })
      );
    });

    it("should return success even if email not found (security)", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/profile/request-password-reset", {
        method: "POST",
        body: {
          email: "nonexistent@example.com",
        },
      });

      const response = await requestPasswordReset(request);

      expect(response.status).toBe(200);
      // Don't reveal that user doesn't exist
      expect(prisma.verificationToken.create).not.toHaveBeenCalled();
    });

    it("should require email", async () => {
      const request = createMockRequest("/api/profile/request-password-reset", {
        method: "POST",
        body: {},
      });

      const response = await requestPasswordReset(request);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/profile/reset-password", () => {
    it("should reset password with valid token", async () => {
      const mockUser = mockPrismaUser({ id: "user-id" });
      const mockToken = {
        id: "token-id",
        userId: "user-id",
        token: "valid-token",
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 3600000), // Not expired
        used: false,
        user: mockUser,
      };

      (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(
        mockToken
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue("new_hashed_password");
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.verificationToken.update as jest.Mock).mockResolvedValue({
        ...mockToken,
        used: true,
      });

      const request = createMockRequest("/api/profile/reset-password", {
        method: "POST",
        body: {
          token: "valid-token",
          newPassword: "newSecurePassword123",
        },
      });

      const response = await resetPassword(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(bcrypt.hash).toHaveBeenCalledWith("newSecurePassword123", 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: { password: "new_hashed_password" },
      });
      expect(prisma.verificationToken.update).toHaveBeenCalledWith({
        where: { id: "token-id" },
        data: { used: true },
      });
    });

    it("should reject expired token", async () => {
      const mockToken = {
        id: "token-id",
        userId: "user-id",
        token: "expired-token",
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() - 3600000), // Expired
        used: false,
      };

      (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(
        mockToken
      );

      const request = createMockRequest("/api/profile/reset-password", {
        method: "POST",
        body: {
          token: "expired-token",
          newPassword: "newPassword123",
        },
      });

      const response = await resetPassword(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject already used token", async () => {
      const mockToken = {
        id: "token-id",
        userId: "user-id",
        token: "used-token",
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 3600000),
        used: true, // Already used
      };

      (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(
        mockToken
      );

      const request = createMockRequest("/api/profile/reset-password", {
        method: "POST",
        body: {
          token: "used-token",
          newPassword: "newPassword123",
        },
      });

      const response = await resetPassword(request);

      expect(response.status).toBe(400);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject invalid token", async () => {
      (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/profile/reset-password", {
        method: "POST",
        body: {
          token: "invalid-token",
          newPassword: "newPassword123",
        },
      });

      const response = await resetPassword(request);

      expect(response.status).toBe(400);
    });

    it("should require token and newPassword", async () => {
      const request = createMockRequest("/api/profile/reset-password", {
        method: "POST",
        body: {
          token: "some-token",
          // Missing newPassword
        },
      });

      const response = await resetPassword(request);

      expect(response.status).toBe(400);
    });
  });
});
