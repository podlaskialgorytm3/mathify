/**
 * Progi i stałe rozbudowanych statystyk ucznia.
 *
 * Zasada nadrzędna: panel nigdy nie diagnozuje "z rozpędu".
 * Statystyka liczona na zbyt małej próbce jest oznaczana jako
 * „za mało danych", a nie prezentowana jako wynik.
 */

/** Minimalna liczba ocenionych zadań, aby uznać wynik rozdziału za diagnozę. */
export const MIN_TASKS_FOR_CHAPTER = 5;

/** Minimalna liczba zadań na danej pozycji, aby pokazać profil „zadanie po zadaniu". */
export const MIN_TASKS_FOR_POSITION = 3;

/** Minimalna liczba prac, aby liczyć trend (regresja z 2 punktów to nie trend). */
export const MIN_SUBMISSIONS_FOR_TREND = 3;

/** Minimalna liczba prac w każdej grupie porównania „materiały vs brak materiałów". */
export const MIN_SUBMISSIONS_FOR_MATERIAL_IMPACT = 3;

/** Okno średniej kroczącej na wykresie trendu. */
export const MOVING_AVERAGE_WINDOW = 3;

/** Próg, poniżej którego zadanie uznajemy za słabo wykonane. */
export const WEAK_TASK_THRESHOLD_PERCENT = 50;

/** Liczba dni pokazywanych na heatmapie aktywności. */
export const ACTIVITY_HEATMAP_DAYS = 182;

/** Ile kategorii błędów pokazujemy uczniowi. */
export const TOP_ERROR_CATEGORIES = 3;

/** Dozwolone zakresy czasowe zapytań statystycznych. */
export const STATISTICS_RANGES = {
  "30d": 30,
  "90d": 90,
  all: null,
} as const;

export type StatisticsRange = keyof typeof STATISTICS_RANGES;
