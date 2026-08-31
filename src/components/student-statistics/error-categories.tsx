"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ErrorCategorySummary } from "@/lib/student-analytics";
import { AlertTriangle } from "lucide-react";

interface Props {
  categories: ErrorCategorySummary[];
}

/** Najczęstsze typy błędów pogrupowane z komentarzy do zadań. */
export function ErrorCategories({ categories }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Najczęstsze typy błędów
        </CardTitle>
        <p className="text-sm text-gray-500">
          Pogrupowane komentarze z zadań, w których straciłeś punkty.
        </p>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nie mamy jeszcze wystarczająco komentarzy, aby wskazać powtarzające
            się typy błędów.
          </p>
        ) : (
          <ol className="space-y-4">
            {categories.map((category, index) => (
              <li key={category.categoryId} className="flex gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                  {index + 1}
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">
                    {category.label}{" "}
                    <span className="font-normal text-gray-500">
                      — {category.occurrences}{" "}
                      {category.occurrences === 1 ? "wystąpienie" : "wystąpień"}
                      , {category.lostPoints} straconych punktów
                    </span>
                  </p>
                  {category.examples[0] && (
                    <p className="text-sm text-gray-500 italic">
                      „{category.examples[0]}"
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
