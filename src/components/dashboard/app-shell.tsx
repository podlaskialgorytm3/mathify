"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart,
  BookOpen,
  Bot,
  Eye,
  FileText,
  HardDrive,
  Home,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LatexMenuItem } from "@/components/dashboard/sidebar/latex-menu-item";
import {
  getPrimaryNavigation,
  type NavigationItem,
} from "@/lib/navigation";

const ICONS: Record<string, LucideIcon> = {
  Award,
  BarChart,
  BookOpen,
  Bot,
  Eye,
  FileText,
  HardDrive,
  Home,
  Settings,
  UserPlus,
  Users,
};

interface Props {
  navigation: NavigationItem[];
  userName: string;
  roleLabel: string;
  showLatexMenu: boolean;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Home;
  return <Icon className={className} />;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

/**
 * Powłoka panelu przystosowana do instalacji jako aplikacja mobilna:
 * na telefonie boczne menu chowa się w szufladzie, a najważniejsze sekcje
 * dostępne są z dolnego paska w zasięgu kciuka.
 */
export function AppShell({
  navigation,
  userName,
  roleLabel,
  showLatexMenu,
  signOutAction,
  children,
}: Props) {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = getPrimaryNavigation(navigation);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const sidebarContent = (
    <nav className="space-y-1 px-2 py-4">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group flex items-center rounded-md px-3 py-3 text-sm font-medium lg:py-2 ${
            isItemActive(pathname, item.href)
              ? "bg-blue-50 text-blue-600"
              : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          }`}
        >
          <NavIcon name={item.icon} className="mr-3 h-5 w-5 flex-shrink-0" />
          <span className="truncate">{item.name}</span>
        </Link>
      ))}
      {showLatexMenu && <LatexMenuItem />}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white safe-top">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Otwórz menu"
            className="-ml-1 rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link
            href="/dashboard"
            className="text-lg font-bold text-blue-600 sm:text-xl"
          >
            Mathify
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[12rem] truncate text-sm font-medium text-gray-900">
                {userName}
              </p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>

            <Link href="/" className="hidden lg:block">
              <Button variant="outline" size="sm" type="button">
                <Home className="mr-2 h-4 w-4" />
                Strona główna
              </Button>
            </Link>

            <Link href="/dashboard/profile">
              <Button
                variant="outline"
                size="sm"
                type="button"
                aria-label="Profil"
              >
                <UserCircle className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Profil</span>
              </Button>
            </Link>

            <form action={signOutAction}>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                aria-label="Wyloguj"
              >
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Wyloguj</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="sticky top-16">{sidebarContent}</div>
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Zamknij menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-gray-900/50"
            />
            <div className="relative flex h-full w-72 max-w-[85%] flex-col overflow-y-auto bg-white shadow-xl safe-top safe-bottom">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Zamknij menu"
                  className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {sidebarContent}

              <div className="mt-auto border-t border-gray-200 px-2 py-3">
                <Link
                  href="/"
                  className="flex items-center rounded-md px-3 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Home className="mr-3 h-5 w-5" />
                  Strona główna
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white safe-bottom lg:hidden">
        <div className="flex">
          {primary.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                <span className="w-full truncate text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
