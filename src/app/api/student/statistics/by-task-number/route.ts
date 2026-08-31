import { NextRequest } from "next/server";

import {
  aggregateByTaskNumber,
  describeTaskPositionPattern,
} from "@/lib/student-analytics";
import { handleStudentStatisticsRequest } from "@/lib/student-analytics/request";

/** Profil „zadanie po zadaniu" — skuteczność wg numeru zadania. */
export async function GET(request: NextRequest) {
  return handleStudentStatisticsRequest(request, (data) => {
    const positions = aggregateByTaskNumber(data.submissions);

    return {
      positions,
      pattern: describeTaskPositionPattern(positions),
    };
  });
}
