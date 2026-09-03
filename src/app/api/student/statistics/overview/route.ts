import { NextRequest } from "next/server";

import { buildOverview } from "@/lib/student-analytics";
import { handleStudentStatisticsRequest } from "@/lib/student-analytics/request";

/** KPI ucznia + trend z regresją i średnią kroczącą. */
export async function GET(request: NextRequest) {
  return handleStudentStatisticsRequest(request, (data) => ({
    overview: buildOverview(data.submissions),
  }));
}
