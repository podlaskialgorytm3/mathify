import { NextRequest } from "next/server";

import { buildRecommendations } from "@/lib/student-analytics";
import { handleStudentStatisticsRequest } from "@/lib/student-analytics/request";

/** Karta „Co dalej?" — diagnoza, przyczyna i linki do materiałów. */
export async function GET(request: NextRequest) {
  return handleStudentStatisticsRequest(request, (data) => ({
    recommendations: buildRecommendations(data.submissions),
  }));
}
