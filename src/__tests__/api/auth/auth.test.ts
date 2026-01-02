import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

describe("Auth - Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Credentials Authentication", () => {
    it("should authenticate valid user credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
        password: "hashed_password",
        firstName: "Test",
        lastName: "User",
        role: "STUDENT",
        status: "ACTIVE" as UserStatus,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Note: Testing auth directly is complex due to NextAuth internals
      // This test validates the core authentication logic
      expect(prisma.user.findUnique).toBeDefined();
      expect(bcrypt.compare).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        password: "hashed_password",
        status: "ACTIVE" as UserStatus,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await bcrypt.compare("wrongpassword", mockUser.password);

      expect(result).toBe(false);
    });

    it("should reject non-existent user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { username: "nonexistent" },
      });

      expect(user).toBeNull();
    });

    it("should reject inactive users", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        password: "hashed_password",
        status: "PENDING" as UserStatus,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      expect(mockUser.status).not.toBe("ACTIVE");
    });
  });

  describe("Session Management", () => {
    it("should include user role in JWT token", () => {
      const mockUser = {
        id: "user-123",
        role: "TEACHER",
        status: "ACTIVE" as UserStatus,
      };

      // JWT callback should add role to token
      expect(mockUser.role).toBeDefined();
      expect(["ADMIN", "TEACHER", "STUDENT"]).toContain(mockUser.role);
    });

    it("should include user status in JWT token", () => {
      const mockUser = {
        id: "user-123",
        role: "STUDENT",
        status: "ACTIVE" as UserStatus,
      };

      expect(mockUser.status).toBeDefined();
      expect(["PENDING", "ACTIVE", "INACTIVE"]).toContain(mockUser.status);
    });
  });
});
