import { NextRequest } from "next/server";

import { summarizeErrorCategories } from "@/lib/student-analytics";
import { handleStudentStatisticsRequest } from "@/lib/student-analytics/request";

/** Najczęstsze typy błędów wyliczone z komentarzy do zadań. */
export async function GET(request: NextRequest) {
  return handleStudentStatisticsRequest(request, (data) => ({
    categories: summarizeErrorCategories(data.submissions),
  }));
}
