import { MIN_SUBMISSIONS_FOR_MATERIAL_IMPACT } from "./constants";
import { getGradedSubmissions, roundTo, submissionPercentage } from "./scoring";
import type { AnalyticsSubmission, MaterialImpactSummary } from "./types";

/**
 * Wpływ oglądania materiałów na wynik.
 *
 * To jest **korelacja, nie przyczynowość**, i tak jest formułowany komunikat
 * ("prace oddane po obejrzeniu materiałów", a nie "materiały podnoszą wynik").
 */
export function summarizeMaterialImpact(
  submissions: AnalyticsSubmission[],
  minSubmissions: number = MIN_SUBMISSIONS_FOR_MATERIAL_IMPACT
): MaterialImpactSummary {
  const graded = getGradedSubmissions(submissions);

  const withMaterials = graded.filter(
    (submission) => submission.viewedMaterialsBeforeSubmission
  );
  const withoutMaterials = graded.filter(
    (submission) => !submission.viewedMaterialsBeforeSubmission
  );

  const average = (items: AnalyticsSubmission[]) =>
    items.length === 0
      ? 0
      : roundTo(
          items.reduce((sum, item) => sum + submissionPercentage(item), 0) /
            items.length
        );

  const withAverage = average(withMaterials);
  const withoutAverage = average(withoutMaterials);

  const enoughData =
    withMaterials.length >= minSubmissions &&
    withoutMaterials.length >= minSubmissions;

  return {
    enoughData,
    withMaterials: {
      submissions: withMaterials.length,
      percentage: withAverage,
    },
    withoutMaterials: {
      submissions: withoutMaterials.length,
      percentage: withoutAverage,
    },
    differencePercentagePoints: roundTo(withAverage - withoutAverage),
    message: enoughData
      ? `Prace oddane po obejrzeniu materiałów z podrozdziału: średnio ${withAverage}%. Prace oddane bez otwarcia materiałów: średnio ${withoutAverage}%.`
      : "Za mało danych, aby porównać prace oddane z materiałami i bez nich.",
  };
}
