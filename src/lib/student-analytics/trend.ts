import {
  MIN_SUBMISSIONS_FOR_TREND,
  MOVING_AVERAGE_WINDOW,
} from "./constants";
import { getGradedSubmissions, roundTo, submissionPercentage } from "./scoring";
import type { AnalyticsSubmission, TrendPoint, TrendSummary } from "./types";

/** Średnia krocząca — wygładza pojedynczą słabą pracę psującą obraz trendu. */
export function movingAverage(
  values: number[],
  window: number = MOVING_AVERAGE_WINDOW
): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < window) {
      return null;
    }

    const slice = values.slice(index + 1 - window, index + 1);
    const sum = slice.reduce((acc, value) => acc + value, 0);

    return roundTo(sum / window);
  });
}

/** Prosta regresja liniowa metodą najmniejszych kwadratów (x = numer pracy). */
export function linearRegression(values: number[]): {
  slope: number;
  intercept: number;
} {
  const n = values.length;

  if (n < 2) {
    return { slope: 0, intercept: values[0] ?? 0 };
  }

  const meanX = (n - 1) / 2;
  const meanY = values.reduce((acc, value) => acc + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY);
    denominator += (index - meanX) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;

  return { slope, intercept: meanY - slope * meanX };
}

export function describeTrend(
  slope: number,
  sampleSize: number
): TrendSummary {
  if (sampleSize < MIN_SUBMISSIONS_FOR_TREND) {
    return {
      slopePerSubmission: roundTo(slope),
      direction: "flat",
      message:
        "Za mało sprawdzonych prac, aby wyznaczyć trend. Wróć tu po kolejnych pracach.",
      enoughData: false,
    };
  }

  const rounded = roundTo(slope);

  if (rounded >= 1) {
    return {
      slopePerSubmission: rounded,
      direction: "up",
      message: `Twoje wyniki rosną średnio o ${rounded} p.p. na pracę.`,
      enoughData: true,
    };
  }

  if (rounded <= -1) {
    return {
      slopePerSubmission: rounded,
      direction: "down",
      message: `Twoje wyniki spadają średnio o ${Math.abs(
        rounded
      )} p.p. na pracę — to dobry moment, żeby wrócić do materiałów.`,
      enoughData: true,
    };
  }

  return {
    slopePerSubmission: rounded,
    direction: "flat",
    message: "Wyniki utrzymują się na stałym poziomie.",
    enoughData: true,
  };
}

/** Punkty wykresu trendu: wynik pracy + średnia krocząca + linia regresji. */
export function buildTrend(submissions: AnalyticsSubmission[]): {
  points: TrendPoint[];
  summary: TrendSummary;
} {
  const graded = getGradedSubmissions(submissions);
  const percentages = graded.map((submission) =>
    roundTo(submissionPercentage(submission))
  );

  const averages = movingAverage(percentages);
  const { slope, intercept } = linearRegression(percentages);

  const points: TrendPoint[] = graded.map((submission, index) => ({
    submissionId: submission.id,
    label: submission.subchapterTitle,
    courseId: submission.courseId,
    courseTitle: submission.courseTitle,
    submittedAt: submission.submittedAt,
    percentage: percentages[index],
    movingAverage: averages[index],
    trendValue:
      percentages.length >= MIN_SUBMISSIONS_FOR_TREND
        ? roundTo(intercept + slope * index)
        : null,
  }));

  return { points, summary: describeTrend(slope, percentages.length) };
}
