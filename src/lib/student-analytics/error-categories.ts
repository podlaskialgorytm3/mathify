import { TOP_ERROR_CATEGORIES } from "./constants";
import { getGradedSubmissions, isPerfectTask } from "./scoring";
import type { AnalyticsSubmission, ErrorCategorySummary } from "./types";

/**
 * Kategoryzacja błędów na podstawie komentarzy do zadań.
 *
 * Świadoma decyzja: zamiast dodatkowego wywołania AI (drogo, wolno) oraz
 * zamiast nowej kolumny w bazie (wymaga migracji i zmiany promptu),
 * klasyfikujemy istniejące komentarze `Task.comment` / `Task.teacherComment`
 * zamkniętą listą reguł słownikowych. Reguły są deterministyczne
 * i w całości pokryte testami.
 *
 * Kolejność ma znaczenie — pierwsza dopasowana reguła wygrywa.
 */
export const ERROR_CATEGORIES: Array<{
  id: string;
  label: string;
  keywords: string[];
}> = [
  {
    id: "domain",
    label: "Pominięta dziedzina lub założenia",
    keywords: [
      "dziedzin",
      "założen",
      "zalozen",
      "warunk",
      "mianownik nie może",
      "wyklucz",
    ],
  },
  {
    id: "fractions",
    label: "Błędy rachunkowe na ułamkach i procentach",
    keywords: ["ułam", "ulam", "procen", "wspólny mianownik", "skracan"],
  },
  {
    id: "formula-transform",
    label: "Błędne przekształcenie wzoru",
    keywords: [
      "przekształ",
      "przeksztal",
      "wzor",
      "wzór",
      "przenies",
      "przeniós",
      "uprosz",
      "równoważn",
    ],
  },
  {
    id: "quadratic",
    label: "Delta i miejsca zerowe funkcji kwadratowej",
    keywords: [
      "delt",
      "miejsc zerow",
      "miejsca zerowe",
      "postać kanoniczn",
      "wierzchołek",
      "wierzcholek",
    ],
  },
  {
    id: "geometry",
    label: "Geometria i rysunek pomocniczy",
    keywords: [
      "rysun",
      "wykres",
      "kąt",
      "kat ",
      "trójkąt",
      "trojkat",
      "pole figur",
      "obwód",
    ],
  },
  {
    id: "units",
    label: "Jednostki i zaokrąglenia",
    keywords: ["jednost", "zaokrąg", "zaokrag", "przybliż", "przybliz"],
  },
  {
    id: "arithmetic",
    label: "Błędy rachunkowe",
    keywords: [
      "rachunk",
      "obliczen",
      "policzy",
      "znak",
      "pomyłk",
      "pomylk",
      "błąd w obliczeniach",
    ],
  },
  {
    id: "justification",
    label: "Brak uzasadnienia / niepełne rozwiązanie",
    keywords: [
      "uzasadni",
      "brak odpowiedzi",
      "nie dokończ",
      "niepełn",
      "niepeln",
      "brak rozwiązania",
      "brak kroków",
    ],
  },
];

const OTHER_CATEGORY = {
  id: "other",
  label: "Inne uwagi do rozwiązania",
};

function normalize(text: string): string {
  return text.toLowerCase();
}

/** Zwraca identyfikator kategorii błędu dla pojedynczego komentarza. */
export function categorizeComment(comment: string | null | undefined): string | null {
  if (!comment || comment.trim().length === 0) {
    return null;
  }

  const normalized = normalize(comment);

  for (const category of ERROR_CATEGORIES) {
    if (category.keywords.some((keyword) => normalized.includes(keyword))) {
      return category.id;
    }
  }

  return OTHER_CATEGORY.id;
}

export function getCategoryLabel(categoryId: string): string {
  return (
    ERROR_CATEGORIES.find((category) => category.id === categoryId)?.label ??
    OTHER_CATEGORY.label
  );
}

/**
 * Najczęstsze typy błędów ucznia.
 *
 * Liczymy wyłącznie zadania, w których faktycznie stracono punkty —
 * komentarz do zadania na 100% punktów nie jest opisem błędu.
 * Komentarz nauczyciela ma pierwszeństwo nad komentarzem AI.
 */
export function summarizeErrorCategories(
  submissions: AnalyticsSubmission[],
  limit: number = TOP_ERROR_CATEGORIES
): ErrorCategorySummary[] {
  const categories = new Map<
    string,
    { occurrences: number; lostPoints: number; examples: string[] }
  >();

  for (const submission of getGradedSubmissions(submissions)) {
    for (const task of submission.tasks) {
      if (isPerfectTask(task)) {
        continue;
      }

      const comment = task.teacherComment?.trim() || task.comment?.trim() || null;
      const categoryId = categorizeComment(comment);

      if (!categoryId || !comment) {
        continue;
      }

      const entry = categories.get(categoryId) ?? {
        occurrences: 0,
        lostPoints: 0,
        examples: [],
      };

      entry.occurrences += 1;
      entry.lostPoints += Math.max(
        0,
        (task.maxPoints ?? 0) - (task.pointsEarned ?? 0)
      );

      if (entry.examples.length < 3) {
        entry.examples.push(comment);
      }

      categories.set(categoryId, entry);
    }
  }

  return Array.from(categories.entries())
    .map(([categoryId, entry]) => ({
      categoryId,
      label: getCategoryLabel(categoryId),
      occurrences: entry.occurrences,
      lostPoints: Math.round(entry.lostPoints * 100) / 100,
      examples: entry.examples,
    }))
    .sort(
      (a, b) => b.occurrences - a.occurrences || b.lostPoints - a.lostPoints
    )
    .slice(0, limit);
}
