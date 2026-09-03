import { NextRequest } from "next/server";

import {
  buildActivitySummary,
  summarizeMaterialImpact,
} from "@/lib/student-analytics";
import { handleStudentStatisticsRequest } from "@/lib/student-analytics/request";

/** Rytm pracy: heatmapa, passa oraz wpływ oglądania materiałów. */
export async function GET(request: NextRequest) {
  return handleStudentStatisticsRequest(request, (data) => ({
    activity: buildActivitySummary(data.submissions),
    materialImpact: summarizeMaterialImpact(data.submissions),
  }));
}
