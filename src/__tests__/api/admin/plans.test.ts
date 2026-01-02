import {
  GET as getPlans,
  POST as createPlan,
} from "@/app/api/admin/plans/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Admin API - Plans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/plans", () => {
    it("should return all plans for admin", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const mockPlans = [
        {
          id: "plan-1",
          name: "Basic",
          maxSubchapters: 10,
          maxStudents: 50,
          price: 99.99,
          currency: "PLN",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "plan-2",
          name: "Premium",
          maxSubchapters: 50,
          maxStudents: 200,
          price: 299.99,
          currency: "PLN",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (prisma.plan.findMany as jest.Mock).mockResolvedValue(mockPlans);

      const request = createMockRequest("/api/admin/plans");
      const response = await getPlans(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.plans).toHaveLength(2);
      expect(prisma.plan.findMany).toHaveBeenCalled();
    });

    it("should deny access to non-admin users", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const request = createMockRequest("/api/admin/plans");
      const response = await getPlans(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/admin/plans", () => {
    it("should create a new plan", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      // Mock findUnique to return null (plan doesn't exist yet)
      (prisma.plan.findUnique as jest.Mock).mockResolvedValue(null);

      const newPlan = {
        id: "new-plan-id",
        name: "Enterprise",
        maxSubchapters: 100,
        maxStudents: 500,
        price: 999.99,
        currency: "PLN",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.plan.create as jest.Mock).mockResolvedValue(newPlan);

      const request = createMockRequest("/api/admin/plans", {
        method: "POST",
        body: {
          name: "Enterprise",
          maxSubchapters: 100,
          maxStudents: 500,
          price: 999.99,
          currency: "PLN",
        },
      });

      const response = await createPlan(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(data.plan).toBeDefined();
      expect(data.plan.name).toBe("Enterprise");
      expect(prisma.plan.create).toHaveBeenCalled();
    });

    it("should require all plan fields", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const request = createMockRequest("/api/admin/plans", {
        method: "POST",
        body: {
          name: "Incomplete Plan",
          // Missing required fields
        },
      });

      const response = await createPlan(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should validate positive numbers for limits", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const request = createMockRequest("/api/admin/plans", {
        method: "POST",
        body: {
          name: "Invalid Plan",
          maxSubchapters: -10,
          maxStudents: 0,
          price: -99.99,
          currency: "PLN",
        },
      });

      const response = await createPlan(request);

      expect(response.status).toBe(400);
    });
  });
});
