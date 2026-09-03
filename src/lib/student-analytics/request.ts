import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import { getStudentAnalyticsData, parseStatisticsQuery } from "./data";
import type { StudentAnalyticsData } from "./data";

/**
 * Wspólna obsługa endpointów statystyk ucznia:
 * autoryzacja (rola STUDENT), zawężenie danych do zalogowanego ucznia,
 * parsowanie filtrów `courseId` i `range` oraz obsługa błędów.
 */
export async function handleStudentStatisticsRequest(
  request: Request,
  build: (data: StudentAnalyticsData) => unknown
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = parseStatisticsQuery(searchParams);

    const data = await getStudentAnalyticsData(session.user.id, query);

    return NextResponse.json({
      ...(build(data) as Record<string, unknown>),
      courses: data.courses,
      filters: query,
    });
  } catch (error) {
    console.error("Error building student statistics:", error);

    return NextResponse.json(
      { error: "Failed to build statistics" },
      { status: 500 }
    );
  }
}
