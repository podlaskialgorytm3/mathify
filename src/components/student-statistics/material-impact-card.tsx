"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialImpactSummary } from "@/lib/student-analytics";
import { BookOpenCheck } from "lucide-react";

interface Props {
  impact: MaterialImpactSummary;
}

/** Wpływ oglądania materiałów na wynik, komunikowany jako korelacja. */
export function MaterialImpactCard({ impact }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5" />
          Materiały a wynik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">{impact.message}</p>

        {impact.enoughData && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-800">
                  Po obejrzeniu materiałów ({impact.withMaterials.submissions}{" "}
                  prac)
                </p>
                <p className="text-2xl font-bold text-emerald-900">
                  {impact.withMaterials.percentage}%
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-600">
                  Bez otwarcia materiałów (
                  {impact.withoutMaterials.submissions} prac)
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {impact.withoutMaterials.percentage}%
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              To zestawienie pokazuje zależność, a nie przyczynę. Uczniowie,
              którzy zaglądają do materiałów, zwykle mają też więcej czasu na
              pracę.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
