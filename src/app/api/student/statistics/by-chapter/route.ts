import { NextRequest } from "next/server";

import {
  aggregateByChapter,
  findStrongestChapter,
  findWeakestChapter,
} from "@/lib/student-analytics";
import { handleStudentStatisticsRequest } from "@/lib/student-analytics/request";

/** Mapa mocnych i słabych stron: agregacja per rozdział. */
export async function GET(request: NextRequest) {
  return handleStudentStatisticsRequest(request, (data) => {
    const chapters = aggregateByChapter(data.submissions);

    return {
      chapters,
      weakestChapter: findWeakestChapter(chapters),
      strongestChapter: findStrongestChapter(chapters),
    };
  });
}
