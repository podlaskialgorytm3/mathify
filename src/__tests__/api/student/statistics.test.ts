import { GET as getActivity } from "@/app/api/student/statistics/activity/route";
import { GET as getByChapter } from "@/app/api/student/statistics/by-chapter/route";
import { GET as getByTaskNumber } from "@/app/api/student/statistics/by-task-number/route";
import { GET as getErrors } from "@/app/api/student/statistics/errors/route";
import { GET as getOverview } from "@/app/api/student/statistics/overview/route";
import { GET as getRecommendations } from "@/app/api/student/statistics/recommendations/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRangeStartDate,
  parseStatisticsQuery,
} from "@/lib/student-analytics/data";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    submission: { findMany: jest.fn() },
    materialView: { findMany: jest.fn() },
    courseEnrollment: { findMany: jest.fn() },
  },
}));

function mockSubmissionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "submission-1",
    submittedAt: new Date("2025-01-10T10:00:00.000Z"),
    subchapter: {
      id: "subchapter-1",
      title: "Delta",
      order: 1,
      chapter: {
        id: "chapter-1",
        title: "Funkcja kwadratowa",
        order: 1,
        course: { id: "course-1", title: "Matematyka rozszerzona" },
      },
    },
    tasks: [
      {
        taskNumber: 1,
        pointsEarned: 2,
        maxPoints: 4,
        comment: "Źle policzona delta",
        teacherComment: null,
        teacherEdited: false,
      },
    ],
    review: { approved: true, reviewedAt: new Date("2025-01-11T10:00:00.000Z") },
    ...overrides,
  };
}

describe("Student API - Statistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.submission.findMany as jest.Mock).mockResolvedValue([
      mockSubmissionRow(),
    ]);
    (prisma.materialView.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.courseEnrollment.findMany as jest.Mock).mockResolvedValue([
      { course: { id: "course-1", title: "Matematyka rozszerzona" } },
    ]);
  });

  describe("parseStatisticsQuery", () => {
    it("przyjmuje wyłącznie znane zakresy", () => {
      expect(
        parseStatisticsQuery(new URLSearchParams("range=30d")).range
      ).toBe("30d");
      expect(
        parseStatisticsQuery(new URLSearchParams("range=hack")).range
      ).toBe("all");
      expect(parseStatisticsQuery(new URLSearchParams()).range).toBe("all");
    });

    it("ignoruje parametr studentId", () => {
      const query = parseStatisticsQuery(
        new URLSearchParams("studentId=other-student&courseId=course-1")
      );

      expect(query).toEqual({ courseId: "course-1", range: "all" });
      expect(query).not.toHaveProperty("studentId");
    });

    it("traktuje pusty courseId jako brak filtra", () => {
      expect(
        parseStatisticsQuery(new URLSearchParams("courseId=%20")).courseId
      ).toBeUndefined();
    });
  });

  describe("getRangeStartDate", () => {
    it("zwraca null dla całego okresu", () => {
      expect(getRangeStartDate("all")).toBeNull();
    });

    it("odejmuje właściwą liczbę dni", () => {
      const now = new Date("2025-03-01T00:00:00.000Z");

      expect(getRangeStartDate("30d", now)?.toISOString()).toBe(
        "2025-01-30T00:00:00.000Z"
      );
      expect(getRangeStartDate("90d", now)?.toISOString()).toBe(
        "2024-12-01T00:00:00.000Z"
      );
    });
  });

  describe("autoryzacja", () => {
    const handlers = [
      ["overview", getOverview],
      ["by-chapter", getByChapter],
      ["by-task-number", getByTaskNumber],
      ["errors", getErrors],
      ["activity", getActivity],
      ["recommendations", getRecommendations],
    ] as const;

    it.each(handlers)(
      "%s zwraca 401 dla niezalogowanego użytkownika",
      async (name, handler) => {
        (auth as jest.Mock).mockResolvedValue(null);

        const response = await handler(
          createMockRequest(`/api/student/statistics/${name}`)
        );

        expect(response.status).toBe(401);
        expect(prisma.submission.findMany).not.toHaveBeenCalled();
      }
    );

    it.each(handlers)(
      "%s zwraca 401 dla nauczyciela",
      async (name, handler) => {
        (auth as jest.Mock).mockResolvedValue(createMockSession("TEACHER"));

        const response = await handler(
          createMockRequest(`/api/student/statistics/${name}`)
        );

        expect(response.status).toBe(401);
        expect(prisma.submission.findMany).not.toHaveBeenCalled();
      }
    );
  });

  describe("zawężenie danych do zalogowanego ucznia", () => {
    it("pobiera prace wyłącznie zalogowanego ucznia, ignorując studentId z URL", async () => {
      (auth as jest.Mock).mockResolvedValue(
        createMockSession("STUDENT", "student-1")
      );

      const response = await getOverview(
        createMockRequest(
          "/api/student/statistics/overview?studentId=someone-else"
        )
      );

      expect(response.status).toBe(200);

      const call = (prisma.submission.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.studentId).toBe("student-1");
      expect(
        (prisma.materialView.findMany as jest.Mock).mock.calls[0][0].where
          .studentId
      ).toBe("student-1");
    });

    it("filtruje po kursie i zakresie dat", async () => {
      (auth as jest.Mock).mockResolvedValue(
        createMockSession("STUDENT", "student-1")
      );

      await getOverview(
        createMockRequest(
          "/api/student/statistics/overview?courseId=course-9&range=30d"
        )
      );

      const call = (prisma.submission.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.subchapter.chapter.courseId).toBe("course-9");
      expect(call.where.submittedAt.gte).toBeInstanceOf(Date);
    });
  });

  describe("odpowiedzi endpointów", () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(
        createMockSession("STUDENT", "student-1")
      );
    });

    it("overview zwraca KPI, listę kursów i użyte filtry", async () => {
      const response = await getOverview(
        createMockRequest("/api/student/statistics/overview")
      );
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.overview.gradedSubmissions).toBe(1);
      expect(data.overview.averagePercentage).toBe(50);
      expect(data.courses).toEqual([
        { id: "course-1", title: "Matematyka rozszerzona" },
      ]);
      expect(data.filters).toEqual({ range: "all" });
    });

    it("by-chapter zwraca agregaty rozdziałów", async () => {
      const data = await getResponseBody(
        await getByChapter(
          createMockRequest("/api/student/statistics/by-chapter")
        )
      );

      expect(data.chapters).toHaveLength(1);
      expect(data.chapters[0].chapterId).toBe("chapter-1");
      expect(data.chapters[0].enoughData).toBe(false);
      expect(data.weakestChapter).toBeNull();
    });

    it("by-task-number zwraca profil pozycji zadań", async () => {
      const data = await getResponseBody(
        await getByTaskNumber(
          createMockRequest("/api/student/statistics/by-task-number")
        )
      );

      expect(data.positions[0]).toMatchObject({
        taskNumber: 1,
        percentage: 50,
      });
      expect(data.pattern.pattern).toBe("unknown");
    });

    it("errors kategoryzuje komentarze do zadań", async () => {
      const data = await getResponseBody(
        await getErrors(createMockRequest("/api/student/statistics/errors"))
      );

      expect(data.categories[0]).toMatchObject({
        categoryId: "quadratic",
        occurrences: 1,
      });
    });

    it("activity zwraca heatmapę i wpływ materiałów", async () => {
      const data = await getResponseBody(
        await getActivity(createMockRequest("/api/student/statistics/activity"))
      );

      expect(Array.isArray(data.activity.days)).toBe(true);
      expect(data.activity.currentStreak).toBe(1);
      expect(data.materialImpact.enoughData).toBe(false);
    });

    it("recommendations zwraca rekomendacje", async () => {
      const data = await getResponseBody(
        await getRecommendations(
          createMockRequest("/api/student/statistics/recommendations")
        )
      );

      expect(data.recommendations.length).toBeGreaterThan(0);
      expect(data.recommendations[0].id).toBe("not-enough-data");
    });

    it("zwraca 500 przy błędzie bazy danych", async () => {
      (prisma.submission.findMany as jest.Mock).mockRejectedValue(
        new Error("db down")
      );
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await getOverview(
        createMockRequest("/api/student/statistics/overview")
      );

      expect(response.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});
