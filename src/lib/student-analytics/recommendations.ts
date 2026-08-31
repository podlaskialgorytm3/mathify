import {
  aggregateByChapter,
  findStrongestChapter,
  findWeakestChapter,
} from "./chapters";
import { summarizeErrorCategories } from "./error-categories";
import { summarizeMaterialImpact } from "./materials";
import { getGradedSubmissions } from "./scoring";
import {
  aggregateByTaskNumber,
  describeTaskPositionPattern,
} from "./task-position";
import { buildTrend } from "./trend";
import type { AnalyticsSubmission, Recommendation } from "./types";

function subchapterHref(courseId: string, subchapterId: string): string {
  return `/dashboard/student/courses/${courseId}/subchapters/${subchapterId}`;
}

/**
 * Karta „Co dalej?”: diagnoza, przyczyna i konkretny link.
 *
 * Język komunikatów jest rozwojowy („tu jest największy potencjał”),
 * a nie oceniający, bo panel ma motywować, a nie zniechęcać.
 */
export function buildRecommendations(
  submissions: AnalyticsSubmission[]
): Recommendation[] {
  const graded = getGradedSubmissions(submissions);

  if (graded.length === 0) {
    return [
      {
        id: "no-data",
        title: "Zacznij od pierwszej sprawdzonej pracy",
        description:
          "Statystyki pojawią się, gdy nauczyciel sprawdzi Twoją pierwszą pracę domową. Wtedy pokażemy, w których działach masz największy potencjał do zysku.",
        links: [],
      },
    ];
  }

  const recommendations: Recommendation[] = [];

  const chapters = aggregateByChapter(submissions);
  const weakest = findWeakestChapter(chapters);
  const strongest = findStrongestChapter(chapters);
  const topErrors = summarizeErrorCategories(submissions);

  if (weakest) {
    const links = weakest.weakestSubchapters
      .slice(0, 3)
      .map((subchapter) => ({
        label: `Wróć do materiałów: „${subchapter.subchapterTitle}” (${subchapter.percentage}%)`,
        href: subchapterHref(weakest.courseId, subchapter.subchapterId),
      }));

    const errorSentence =
      topErrors.length > 0
        ? ` Najczęstszy powtarzający się problem: ${topErrors[0].label.toLowerCase()}.`
        : "";

    recommendations.push({
      id: "weakest-chapter",
      title: `Największy potencjał do zysku: „${weakest.chapterTitle}” (${weakest.percentage}%)`,
      description: `Wynik policzony z ${weakest.taskCount} zadań w ${weakest.submissionCount} pracach.${errorSentence}`,
      links,
    });
  } else {
    recommendations.push({
      id: "not-enough-data",
      title: "Za mało danych na diagnozę tematyczną",
      description:
        "Żaden rozdział nie ma jeszcze wystarczającej liczby ocenionych zadań, aby uczciwie wskazać Twoją słabszą stronę. Po kolejnych pracach pojawi się tu konkretna rekomendacja.",
      links: [],
    });
  }

  const positions = aggregateByTaskNumber(submissions);
  const pattern = describeTaskPositionPattern(positions);

  if (pattern.pattern === "declining" || pattern.pattern === "rising") {
    recommendations.push({
      id: "task-position",
      title: "Wzorzec w obrębie pracy",
      description: pattern.message,
      links: [],
    });
  }

  const materialImpact = summarizeMaterialImpact(submissions);

  if (
    materialImpact.enoughData &&
    materialImpact.differencePercentagePoints >= 5
  ) {
    recommendations.push({
      id: "materials",
      title: "Materiały przed pracą robią różnicę",
      description: `${materialImpact.message} To korelacja, nie gwarancja, ale warto zajrzeć do materiałów przed kolejną pracą.`,
      links: [],
    });
  }

  const { summary: trend } = buildTrend(submissions);

  if (trend.enoughData) {
    recommendations.push({
      id: "trend",
      title: "Twój trend",
      description: trend.message,
      links: [],
    });
  }

  if (strongest && strongest.chapterId !== weakest?.chapterId) {
    recommendations.push({
      id: "strongest-chapter",
      title: `Twoja mocna strona: „${strongest.chapterTitle}” (${strongest.percentage}%)`,
      description:
        "Ten dział masz opanowany, więc problem nie jest „z matmy”, tylko z konkretnym tematem.",
      links: [],
    });
  }

  return recommendations;
}
