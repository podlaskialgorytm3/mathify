"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recommendation } from "@/lib/student-analytics";
import { ArrowRight, Compass } from "lucide-react";

interface Props {
  recommendations: Recommendation[];
}

/** Karta „Co dalej?”: diagnoza, przyczyna i konkretny link do materiałów. */
export function NextStepsCard({ recommendations }: Props) {
  return (
    <Card className="border-sky-200 bg-sky-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-900">
          <Compass className="h-5 w-5" />
          Co dalej?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {recommendations.map((recommendation) => (
          <div key={recommendation.id} className="space-y-2">
            <p className="font-semibold text-sky-900">
              {recommendation.title}
            </p>
            <p className="text-sm text-sky-900/80">
              {recommendation.description}
            </p>
            {recommendation.links.length > 0 && (
              <ul className="space-y-1">
                {recommendation.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
                    >
                      <ArrowRight className="h-3 w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
