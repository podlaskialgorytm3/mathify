import {
  aggregateByChapter,
  aggregateByTaskNumber,
  buildActivitySummary,
  buildOverview,
  buildRecommendations,
  buildTrend,
  calculateCurrentStreak,
  calculateLongestStreak,
  categorizeComment,
  describeTaskPositionPattern,
  describeTrend,
  findStrongestChapter,
  findWeakestChapter,
  getGradedSubmissions,
  isGraded,
  isPerfectTask,
  isWeakTask,
  linearRegression,
  movingAverage,
  summarizeErrorCategories,
  summarizeMaterialImpact,
  summarizePoints,
  toDateKey,
  toPercentage,
} from "@/lib/student-analytics";
import type {
  AnalyticsSubmission,
  AnalyticsTask,
} from "@/lib/student-analytics";

function task(overrides: Partial<AnalyticsTask> = {}): AnalyticsTask {
  return {
    taskNumber: 1,
    pointsEarned: 2,
    maxPoints: 2,
    comment: null,
    teacherComment: null,
    ...overrides,
  };
}

function submission(
  overrides: Partial<AnalyticsSubmission> = {}
): AnalyticsSubmission {
  return {
    id: "sub-1",
    submittedAt: "2025-01-10T10:00:00.000Z",
    reviewedAt: "2025-01-11T10:00:00.000Z",
    reviewed: true,
    approved: true,
    courseId: "course-1",
    courseTitle: "Matematyka rozszerzona",
    chapterId: "chapter-1",
    chapterTitle: "Funkcja kwadratowa",
    chapterOrder: 1,
    subchapterId: "sub-chapter-1",
    subchapterTitle: "Postać kanoniczna",
    subchapterOrder: 1,
    viewedMaterialsBeforeSubmission: false,
    tasks: [task()],
    ...overrides,
  };
}

/** Praca z zadanym procentem wyniku (1 zadanie na 10 punktów). */
function submissionWithPercentage(
  id: string,
  percentage: number,
  overrides: Partial<AnalyticsSubmission> = {}
): AnalyticsSubmission {
  return submission({
    id,
    tasks: [task({ pointsEarned: percentage / 10, maxPoints: 10 })],
    ...overrides,
  });
}

describe("student-analytics / scoring", () => {
  it("sumuje punkty i liczy procent", () => {
    const result = summarizePoints([
      task({ pointsEarned: 3, maxPoints: 4 }),
      task({ pointsEarned: 1, maxPoints: 4 }),
    ]);

    expect(result).toEqual({ earned: 4, max: 8, percentage: 50 });
  });

  it("zabezpiecza przed dzieleniem przez zero", () => {
    expect(toPercentage(0, 0)).toBe(0);
    expect(summarizePoints([]).percentage).toBe(0);
  });

  it("uznaje za ocenioną tylko pracę sprawdzoną i z zadaniami", () => {
    expect(isGraded(submission())).toBe(true);
    expect(isGraded(submission({ reviewed: false }))).toBe(false);
    expect(isGraded(submission({ tasks: [] }))).toBe(false);
  });

  it("sortuje ocenione prace chronologicznie", () => {
    const graded = getGradedSubmissions([
      submission({ id: "b", submittedAt: "2025-02-01T10:00:00.000Z" }),
      submission({ id: "a", submittedAt: "2025-01-01T10:00:00.000Z" }),
      submission({ id: "pending", reviewed: false }),
    ]);

    expect(graded.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("rozpoznaje zadania słabe i bezbłędne", () => {
    expect(isWeakTask(task({ pointsEarned: 1, maxPoints: 4 }))).toBe(true);
    expect(isWeakTask(task({ pointsEarned: 2, maxPoints: 4 }))).toBe(false);
    expect(isPerfectTask(task({ pointsEarned: 4, maxPoints: 4 }))).toBe(true);
    expect(isPerfectTask(task({ pointsEarned: 0, maxPoints: 0 }))).toBe(false);
  });
});

describe("student-analytics / trend", () => {
  it("liczy średnią kroczącą dopiero od pełnego okna", () => {
    expect(movingAverage([10, 20, 30, 40], 3)).toEqual([null, null, 20, 30]);
  });

  it("wyznacza nachylenie regresji liniowej", () => {
    expect(linearRegression([10, 20, 30]).slope).toBeCloseTo(10);
    expect(linearRegression([30, 20, 10]).slope).toBeCloseTo(-10);
    expect(linearRegression([50, 50, 50]).slope).toBeCloseTo(0);
    expect(linearRegression([42]).slope).toBe(0);
  });

  it("nie ogłasza trendu przy zbyt małej próbce", () => {
    const result = describeTrend(12, 2);

    expect(result.enoughData).toBe(false);
    expect(result.direction).toBe("flat");
    expect(result.message).toMatch(/Za mało/);
  });

  it("opisuje kierunek trendu", () => {
    expect(describeTrend(5, 5).direction).toBe("up");
    expect(describeTrend(-5, 5).direction).toBe("down");
    expect(describeTrend(0.2, 5).direction).toBe("flat");
  });

  it("buduje punkty wykresu wraz z linią trendu", () => {
    const { points, summary } = buildTrend([
      submissionWithPercentage("s1", 40),
      submissionWithPercentage("s2", 60, {
        submittedAt: "2025-01-20T10:00:00.000Z",
      }),
      submissionWithPercentage("s3", 80, {
        submittedAt: "2025-01-30T10:00:00.000Z",
      }),
    ]);

    expect(points).toHaveLength(3);
    expect(points.map((point) => point.percentage)).toEqual([40, 60, 80]);
    expect(points[2].movingAverage).toBe(60);
    expect(points[0].trendValue).not.toBeNull();
    expect(summary.direction).toBe("up");
    expect(summary.enoughData).toBe(true);
  });
});

describe("student-analytics / chapters", () => {
  const submissions = [
    submission({
      id: "s1",
      chapterId: "chapter-1",
      chapterTitle: "Funkcja kwadratowa",
      subchapterId: "sc-1",
      subchapterTitle: "Delta",
      tasks: [
        task({ taskNumber: 1, pointsEarned: 1, maxPoints: 4 }),
        task({ taskNumber: 2, pointsEarned: 1, maxPoints: 4 }),
        task({ taskNumber: 3, pointsEarned: 2, maxPoints: 4 }),
      ],
    }),
    submission({
      id: "s2",
      chapterId: "chapter-1",
      chapterTitle: "Funkcja kwadratowa",
      subchapterId: "sc-2",
      subchapterTitle: "Wierzchołek",
      tasks: [
        task({ taskNumber: 1, pointsEarned: 4, maxPoints: 4 }),
        task({ taskNumber: 2, pointsEarned: 4, maxPoints: 4 }),
      ],
    }),
    submission({
      id: "s3",
      chapterId: "chapter-2",
      chapterTitle: "Trygonometria",
      subchapterId: "sc-3",
      subchapterTitle: "Sinus",
      tasks: [task({ taskNumber: 1, pointsEarned: 4, maxPoints: 4 })],
    }),
  ];

  it("agreguje wyniki per rozdział i sortuje rosnąco", () => {
    const chapters = aggregateByChapter(submissions);

    expect(chapters.map((chapter) => chapter.chapterId)).toEqual([
      "chapter-1",
      "chapter-2",
    ]);

    const first = chapters[0];
    expect(first.taskCount).toBe(5);
    expect(first.submissionCount).toBe(2);
    expect(first.percentage).toBe(60);
    expect(first.enoughData).toBe(true);
  });

  it("oznacza rozdziały ze zbyt małą próbką jako niewiarygodne", () => {
    const chapters = aggregateByChapter(submissions);
    const trygonometria = chapters.find(
      (chapter) => chapter.chapterId === "chapter-2"
    );

    expect(trygonometria?.enoughData).toBe(false);
  });

  it("wskazuje najsłabszy podrozdział w rozdziale", () => {
    const chapters = aggregateByChapter(submissions);

    expect(chapters[0].weakestSubchapters[0]).toMatchObject({
      subchapterId: "sc-1",
      percentage: 33.3,
    });
  });

  it("wybiera skrajne rozdziały tylko spośród wiarygodnych", () => {
    const chapters = aggregateByChapter(submissions);

    expect(findWeakestChapter(chapters)?.chapterId).toBe("chapter-1");
    expect(findStrongestChapter(chapters)?.chapterId).toBe("chapter-1");
    expect(findWeakestChapter([])).toBeNull();
    expect(
      findStrongestChapter(
        chapters.map((chapter) => ({ ...chapter, enoughData: false }))
      )
    ).toBeNull();
  });
});

describe("student-analytics / profil zadanie po zadaniu", () => {
  function positionSubmission(id: string, points: number[]) {
    return submission({
      id,
      tasks: points.map((pointsEarned, index) =>
        task({ taskNumber: index + 1, pointsEarned, maxPoints: 4 })
      ),
    });
  }

  const declining = [
    positionSubmission("s1", [4, 4, 4, 1, 0]),
    positionSubmission("s2", [4, 4, 3, 1, 1]),
    positionSubmission("s3", [4, 3, 3, 0, 1]),
  ];

  it("agreguje skuteczność wg numeru zadania", () => {
    const positions = aggregateByTaskNumber(declining);

    expect(positions.map((position) => position.taskNumber)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(positions[0].percentage).toBe(100);
    expect(positions[4].percentage).toBeLessThan(30);
    expect(positions.every((position) => position.enoughData)).toBe(true);
  });

  it("rozpoznaje spadek skuteczności w końcówce pracy", () => {
    const pattern = describeTaskPositionPattern(aggregateByTaskNumber(declining));

    expect(pattern.pattern).toBe("declining");
    expect(pattern.message).toMatch(/końcówce/);
  });

  it("nie ocenia wzorca przy zbyt małej liczbie pozycji", () => {
    const pattern = describeTaskPositionPattern(
      aggregateByTaskNumber([positionSubmission("s1", [4, 2])])
    );

    expect(pattern.pattern).toBe("unknown");
  });

  it("rozpoznaje równomierną skuteczność", () => {
    const stable = [
      positionSubmission("s1", [3, 3, 3, 3]),
      positionSubmission("s2", [3, 3, 3, 3]),
      positionSubmission("s3", [3, 3, 3, 3]),
    ];

    expect(describeTaskPositionPattern(aggregateByTaskNumber(stable)).pattern).toBe(
      "stable"
    );
  });
});

describe("student-analytics / kategorie błędów", () => {
  it("klasyfikuje komentarze wg reguł słownikowych", () => {
    expect(categorizeComment("Brak wyznaczonej dziedziny")).toBe("domain");
    expect(categorizeComment("Błąd przy skracaniu ułamka")).toBe("fractions");
    expect(categorizeComment("Źle policzona delta")).toBe("quadratic");
    expect(categorizeComment("Brak jednostki w odpowiedzi")).toBe("units");
    expect(categorizeComment("Coś zupełnie innego")).toBe("other");
  });

  it("ignoruje puste komentarze", () => {
    expect(categorizeComment(null)).toBeNull();
    expect(categorizeComment("   ")).toBeNull();
  });

  it("zlicza tylko zadania, w których stracono punkty", () => {
    const categories = summarizeErrorCategories([
      submission({
        id: "s1",
        tasks: [
          task({
            taskNumber: 1,
            pointsEarned: 4,
            maxPoints: 4,
            comment: "Brak dziedziny",
          }),
          task({
            taskNumber: 2,
            pointsEarned: 1,
            maxPoints: 4,
            comment: "Brak dziedziny funkcji",
          }),
        ],
      }),
    ]);

    expect(categories).toHaveLength(1);
    expect(categories[0]).toMatchObject({
      categoryId: "domain",
      occurrences: 1,
      lostPoints: 3,
    });
  });

  it("daje pierwszeństwo komentarzowi nauczyciela", () => {
    const categories = summarizeErrorCategories([
      submission({
        tasks: [
          task({
            pointsEarned: 0,
            maxPoints: 4,
            comment: "Błąd rachunkowy",
            teacherComment: "Nie wyznaczono dziedziny",
          }),
        ],
      }),
    ]);

    expect(categories[0].categoryId).toBe("domain");
    expect(categories[0].examples[0]).toBe("Nie wyznaczono dziedziny");
  });

  it("zwraca najczęstsze kategorie w kolejności malejącej", () => {
    const categories = summarizeErrorCategories(
      [
        submission({
          id: "s1",
          tasks: [
            task({ taskNumber: 1, pointsEarned: 0, maxPoints: 4, comment: "delta" }),
            task({ taskNumber: 2, pointsEarned: 0, maxPoints: 4, comment: "delta" }),
            task({
              taskNumber: 3,
              pointsEarned: 1,
              maxPoints: 4,
              comment: "brak jednostki",
            }),
          ],
        }),
      ],
      1
    );

    expect(categories).toHaveLength(1);
    expect(categories[0].categoryId).toBe("quadratic");
  });
});

describe("student-analytics / aktywność", () => {
  const now = new Date("2025-03-01T12:00:00.000Z");

  it("buduje heatmapę kończącą się na dniu dzisiejszym", () => {
    const activity = buildActivitySummary(
      [submission({ submittedAt: "2025-02-27T09:00:00.000Z" })],
      now,
      7
    );

    expect(activity.days).toHaveLength(7);
    expect(activity.days[6].date).toBe("2025-03-01");
    expect(
      activity.days.find((day) => day.date === "2025-02-27")?.submissions
    ).toBe(1);
  });

  it("liczy passę sprawdzonych prac od najnowszej", () => {
    const submissions = [
      submission({ id: "s1", submittedAt: "2025-01-01T10:00:00.000Z" }),
      submission({
        id: "s2",
        submittedAt: "2025-01-05T10:00:00.000Z",
        reviewed: false,
      }),
      submission({ id: "s3", submittedAt: "2025-01-10T10:00:00.000Z" }),
    ];

    expect(calculateCurrentStreak(submissions)).toBe(1);
    expect(calculateLongestStreak(submissions)).toBe(1);
  });

  it("liczy średni odstęp między pracami i czas oczekiwania na sprawdzenie", () => {
    const activity = buildActivitySummary(
      [
        submission({
          id: "s1",
          submittedAt: "2025-02-20T10:00:00.000Z",
          reviewedAt: "2025-02-21T10:00:00.000Z",
        }),
        submission({
          id: "s2",
          submittedAt: "2025-02-24T10:00:00.000Z",
          reviewedAt: "2025-02-25T10:00:00.000Z",
        }),
      ],
      now
    );

    expect(activity.averageDaysBetweenSubmissions).toBe(4);
    expect(activity.averageReviewWaitHours).toBe(24);
    expect(activity.submissionsLast30Days).toBe(2);
  });

  it("normalizuje datę do klucza UTC", () => {
    expect(toDateKey("2025-03-01T23:30:00.000Z")).toBe("2025-03-01");
  });
});

describe("student-analytics / wpływ materiałów", () => {
  it("nie porównuje grup przy zbyt małej próbce", () => {
    const impact = summarizeMaterialImpact([
      submissionWithPercentage("s1", 80, {
        viewedMaterialsBeforeSubmission: true,
      }),
      submissionWithPercentage("s2", 40),
    ]);

    expect(impact.enoughData).toBe(false);
    expect(impact.message).toMatch(/Za mało danych/);
  });

  it("porównuje prace z materiałami i bez nich", () => {
    const withMaterials = [80, 90, 100].map((percentage, index) =>
      submissionWithPercentage(`w${index}`, percentage, {
        viewedMaterialsBeforeSubmission: true,
      })
    );
    const withoutMaterials = [40, 50, 60].map((percentage, index) =>
      submissionWithPercentage(`o${index}`, percentage)
    );

    const impact = summarizeMaterialImpact([
      ...withMaterials,
      ...withoutMaterials,
    ]);

    expect(impact.enoughData).toBe(true);
    expect(impact.withMaterials.percentage).toBe(90);
    expect(impact.withoutMaterials.percentage).toBe(50);
    expect(impact.differencePercentagePoints).toBe(40);
  });
});

describe("student-analytics / overview", () => {
  it("liczy KPI wyłącznie ze sprawdzonych prac", () => {
    const overview = buildOverview(
      [
        submission({
          id: "s1",
          tasks: [
            task({ taskNumber: 1, pointsEarned: 4, maxPoints: 4 }),
            task({
              taskNumber: 2,
              pointsEarned: 1,
              maxPoints: 4,
            }),
          ],
        }),
        submission({
          id: "s2",
          submittedAt: "2025-01-20T10:00:00.000Z",
          reviewed: false,
          reviewedAt: null,
          tasks: [task({ pointsEarned: 0, maxPoints: 4 })],
        }),
      ],
      new Date("2025-02-01T10:00:00.000Z")
    );

    expect(overview.totalSubmissions).toBe(2);
    expect(overview.gradedSubmissions).toBe(1);
    expect(overview.pendingSubmissions).toBe(1);
    expect(overview.totalPointsEarned).toBe(5);
    expect(overview.totalPointsMax).toBe(8);
    expect(overview.averagePercentage).toBe(62.5);
    expect(overview.totalTasks).toBe(2);
    expect(overview.perfectTasks).toBe(1);
    expect(overview.weakTasks).toBe(1);
    expect(overview.trend.enoughData).toBe(false);
  });

  it("zwraca zerowe KPI bez sprawdzonych prac", () => {
    const overview = buildOverview([]);

    expect(overview.gradedSubmissions).toBe(0);
    expect(overview.averagePercentage).toBe(0);
    expect(overview.bestPercentage).toBe(0);
    expect(overview.trendPoints).toEqual([]);
  });
});

describe("student-analytics / rekomendacje", () => {
  it("prosi o pierwszą sprawdzoną pracę, gdy brak danych", () => {
    const recommendations = buildRecommendations([]);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe("no-data");
  });

  it("informuje o zbyt małej próbce zamiast zgadywać", () => {
    const recommendations = buildRecommendations([
      submission({ tasks: [task({ pointsEarned: 0, maxPoints: 4 })] }),
    ]);

    expect(recommendations[0].id).toBe("not-enough-data");
  });

  it("wskazuje najsłabszy rozdział z linkami do podrozdziałów", () => {
    const weak = submission({
      id: "weak",
      chapterId: "chapter-1",
      chapterTitle: "Funkcja kwadratowa",
      subchapterId: "sc-1",
      subchapterTitle: "Delta",
      tasks: Array.from({ length: 5 }, (_, index) =>
        task({ taskNumber: index + 1, pointsEarned: 1, maxPoints: 4, comment: "delta" })
      ),
    });

    const strong = submission({
      id: "strong",
      submittedAt: "2025-01-15T10:00:00.000Z",
      chapterId: "chapter-2",
      chapterTitle: "Trygonometria",
      subchapterId: "sc-2",
      subchapterTitle: "Sinus",
      tasks: Array.from({ length: 5 }, (_, index) =>
        task({ taskNumber: index + 1, pointsEarned: 4, maxPoints: 4 })
      ),
    });

    const recommendations = buildRecommendations([weak, strong]);
    const weakest = recommendations.find(
      (recommendation) => recommendation.id === "weakest-chapter"
    );

    expect(weakest).toBeDefined();
    expect(weakest?.title).toContain("Funkcja kwadratowa");
    expect(weakest?.links[0].href).toBe(
      "/dashboard/student/courses/course-1/subchapters/sc-1"
    );
    expect(
      recommendations.some(
        (recommendation) => recommendation.id === "strongest-chapter"
      )
    ).toBe(true);
  });
});
