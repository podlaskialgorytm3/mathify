import type { UserRole } from "@prisma/client";

export interface NavigationItem {
  name: string;
  href: string;
  /** Nazwa ikony z lucide-react, mapowana po stronie klienta. */
  icon: string;
  /** Czy pozycja ma trafić do dolnego paska na telefonie. */
  primary?: boolean;
}

/**
 * Jedno źródło prawdy dla nawigacji panelu.
 *
 * Ikony trzymamy jako nazwy, a nie komponenty, bo konfiguracja jest
 * współdzielona między komponentem serwerowym a klienckim, a komponentów
 * React nie da się przesłać przez granicę serwer/klient.
 */
export const DASHBOARD_NAVIGATION: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    { name: "Panel główny", href: "/dashboard", icon: "Home", primary: true },
    {
      name: "Użytkownicy",
      href: "/dashboard/admin/users",
      icon: "Users",
      primary: true,
    },
    {
      name: "Kursy",
      href: "/dashboard/admin/courses",
      icon: "BookOpen",
      primary: true,
    },
    { name: "Plany", href: "/dashboard/admin/plans", icon: "Award" },
    {
      name: "Ustawienia",
      href: "/dashboard/admin/settings",
      icon: "Settings",
      primary: true,
    },
    { name: "Dysk", href: "/dashboard/admin/disk", icon: "HardDrive" },
  ],
  TEACHER: [
    { name: "Panel główny", href: "/dashboard", icon: "Home", primary: true },
    {
      name: "Moje kursy",
      href: "/dashboard/teacher/courses",
      icon: "BookOpen",
      primary: true,
    },
    {
      name: "Sprawdzanie prac",
      href: "/dashboard/teacher/submissions",
      icon: "BarChart",
      primary: true,
    },
    {
      name: "Ustawienia Zapytań AI",
      href: "/dashboard/teacher/ai-prompts",
      icon: "Bot",
    },
    {
      name: "Uczniowie",
      href: "/dashboard/teacher/students",
      icon: "Users",
      primary: true,
    },
    {
      name: "Tworzenie kont uczniom",
      href: "/dashboard/teacher/create-student",
      icon: "UserPlus",
    },
    { name: "Dysk", href: "/dashboard/teacher/disk", icon: "HardDrive" },
    { name: "Wyświetlenia", href: "/dashboard/teacher/views", icon: "Eye" },
    { name: "Aplikacja", href: "/dashboard/teacher/app", icon: "Smartphone" },
  ],
  STUDENT: [
    { name: "Panel główny", href: "/dashboard", icon: "Home", primary: true },
    {
      name: "Moje kursy",
      href: "/dashboard/student/courses",
      icon: "BookOpen",
      primary: true,
    },
    {
      name: "Moje prace",
      href: "/dashboard/student/submissions",
      icon: "FileText",
      primary: true,
    },
    {
      name: "Statystyki",
      href: "/dashboard/student/statistics",
      icon: "BarChart",
      primary: true,
    },
    { name: "Aplikacja", href: "/dashboard/student/app", icon: "Smartphone" },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  TEACHER: "Nauczyciel",
  STUDENT: "Uczeń",
};

/** Maksymalnie cztery pozycje mieszczą się wygodnie w dolnym pasku telefonu. */
export function getPrimaryNavigation(
  items: NavigationItem[]
): NavigationItem[] {
  return items.filter((item) => item.primary).slice(0, 4);
}
