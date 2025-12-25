import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, FileText, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Redirect based on role
  if (user.role === "ADMIN") {
    return <AdminDashboard user={user} />;
  } else if (user.role === "TEACHER") {
    return <TeacherDashboard user={user} />;
  } else {
    return <StudentDashboard user={user} />;
  }
}

function AdminDashboard({ user }: any) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Witaj, {user.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Wszyscy użytkownicy
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Załaduj statystyki</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Oczekujące konta
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Wymagają zatwierdzenia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Wszystkie kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">W systemie</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prace domowe
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Przesłanych prac</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panel administratora</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Zarządzaj użytkownikami, kursami i systemem. Wybierz opcję z menu po
            lewej stronie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDashboard({ user }: any) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Witaj, {user.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Moje kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Aktywnych kursów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Moi uczniowie
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Zapisanych uczniów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Do sprawdzenia
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Prac oczekujących</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panel nauczyciela</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Zarządzaj swoimi kursami, uczniami i sprawdzaj prace domowe. Wybierz
            opcję z menu po lewej stronie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentDashboard({ user }: any) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Witaj, {user.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Moje kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Zapisanych kursów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Przesłane prace
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Wszystkich prac</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Średnia ocen
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---%</div>
            <p className="text-xs text-gray-500 mt-1">Z wszystkich prac</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panel ucznia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Przeglądaj swoje kursy, przesyłaj prace domowe i śledź swoje
            postępy. Wybierz opcję z menu po lewej stronie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
