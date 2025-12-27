import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import {
  LogOut,
  Home,
  BookOpen,
  Users,
  Settings,
  BarChart,
  Bot,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  const navigation = {
    ADMIN: [
      { name: "Panel główny", href: "/dashboard", icon: Home },
      { name: "Użytkownicy", href: "/dashboard/admin/users", icon: Users },
      { name: "Kursy", href: "/dashboard/admin/courses", icon: BookOpen },
      { name: "Ustawienia", href: "/dashboard/admin/settings", icon: Settings },
    ],
    TEACHER: [
      { name: "Panel główny", href: "/dashboard", icon: Home },
      {
        name: "Moje kursy",
        href: "/dashboard/teacher/courses",
        icon: BookOpen,
      },
      {
        name: "Sprawdzanie prac",
        href: "/dashboard/teacher/submissions",
        icon: BarChart,
      },
      {
        name: "Ustawienia Zapytań AI",
        href: "/dashboard/teacher/ai-prompts",
        icon: Bot,
      },
      { name: "Uczniowie", href: "/dashboard/teacher/students", icon: Users },
    ],
    STUDENT: [
      { name: "Panel główny", href: "/dashboard", icon: Home },
      {
        name: "Moje kursy",
        href: "/dashboard/student/courses",
        icon: BookOpen,
      },
      {
        name: "Moje prace",
        href: "/dashboard/student/submissions",
        icon: BarChart,
      },
      {
        name: "Statystyki",
        href: "/dashboard/student/statistics",
        icon: BarChart,
      },
    ],
  };

  const userNav = navigation[user.role] || [];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/dashboard"
                  className="text-xl font-bold text-blue-600"
                >
                  Mathify
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-gray-500 text-xs">
                  {user.role === "ADMIN"
                    ? "Administrator"
                    : user.role === "TEACHER"
                    ? "Nauczyciel"
                    : "Uczeń"}
                </p>
              </div>
              <form action={handleSignOut}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="w-4 h-4 mr-2" />
                  Wyloguj
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="mt-5 px-2 space-y-1">
            {userNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
