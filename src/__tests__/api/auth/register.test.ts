import { POST as registerHandler } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createMockRequest,
  getResponseBody,
} from "@/__tests__/utils/test-helpers";

// Mock dependencies
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

describe("Auth API - Register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const mockHashedPassword = "hashed_password_123";
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "new-user-id",
        email: "newuser@example.com",
        username: "newuser",
        firstName: "New",
        lastName: "User",
        role: "STUDENT",
        status: "PENDING",
      });

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          email: "newuser@example.com",
          username: "newuser",
          password: "password123",
          firstName: "New",
          lastName: "User",
          role: "STUDENT",
        },
      });

      const response = await registerHandler(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(data.message).toContain("Rejestracja");
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("should return error if email already exists", async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce({
          // email check
          id: "existing-id",
          email: "existing@example.com",
        });

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          email: "existing@example.com",
          username: "newuser",
          password: "password123",
          firstName: "New",
          lastName: "User",
          role: "STUDENT",
        },
      });

      const response = await registerHandler(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("Email");
    });

    it("should return error if username already exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "existing-id",
        username: "existinguser",
      }); // username check

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          email: "new@example.com",
          username: "existinguser",
          password: "password123",
          firstName: "New",
          lastName: "User",
          role: "STUDENT",
        },
      });

      const response = await registerHandler(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("Login");
    });

    it("should return error for missing required fields", async () => {
      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          email: "test@example.com",
          // Missing username, password, firstName, lastName, role
        },
      });

      const response = await registerHandler(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Wszystkie pola są wymagane");
    });

    it("should require valid role", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          email: "test@example.com",
          username: "testuser",
          password: "password123",
          firstName: "Test",
          lastName: "User",
          role: "ADMIN", // Invalid role for registration
        },
      });

      const response = await registerHandler(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("rola");
    });

    it("should handle database errors gracefully", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          email: "test@example.com",
          username: "testuser",
          password: "password123",
          firstName: "Test",
          lastName: "User",
          role: "STUDENT",
        },
      });

      const response = await registerHandler(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(data.error).toContain("błąd");
    });
  });
});
