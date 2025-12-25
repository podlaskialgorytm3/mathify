"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings as SettingsIcon,
  Users,
  BookOpen,
  Mail,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Globe,
} from "lucide-react";

interface Settings {
  statistics: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    totalCourses: number;
    totalTeachers: number;
    totalStudents: number;
    totalSubmissions: number;
  };
  email: {
    configured: boolean;
    host: string;
    port: string;
    from: string;
  };
  ai: {
    testMode: boolean;
    configured: boolean;
  };
  app: {
    url: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać ustawień",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania ustawień",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Ładowanie ustawień...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nie udało się załadować ustawień</p>
        <Button onClick={fetchSettings} className="mt-4">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia Systemu</h1>
        <p className="text-gray-600 mt-2">
          Konfiguracja i statystyki aplikacji Mathify
        </p>
      </div>

      {/* System Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Statystyki Systemu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Wszyscy użytkownicy</p>
                  <p className="text-3xl font-bold">
                    {settings.statistics.totalUsers}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktywni: {settings.statistics.activeUsers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Oczekujące konta</p>
                  <p className="text-3xl font-bold">
                    {settings.statistics.pendingUsers}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Do zatwierdzenia</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nauczyciele</p>
                  <p className="text-3xl font-bold">
                    {settings.statistics.totalTeachers}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Aktywnych</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Uczniowie</p>
                  <p className="text-3xl font-bold">
                    {settings.statistics.totalStudents}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Zarejestrowanych</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kursy</p>
                  <p className="text-3xl font-bold">
                    {settings.statistics.totalCourses}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Utworzonych</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rozwiązania</p>
                  <p className="text-3xl font-bold">
                    {settings.statistics.totalSubmissions}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Przesłanych prac</p>
                </div>
                <Database className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Konfiguracja Email
              </CardTitle>
              <CardDescription>
                Ustawienia serwera SMTP do wysyłania powiadomień
              </CardDescription>
            </div>
            {settings.email.configured ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Skonfigurowane</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Nieskonfigurowane</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Host SMTP</Label>
              <Input value={settings.email.host || "Nie ustawiono"} disabled />
            </div>
            <div>
              <Label>Port</Label>
              <Input value={settings.email.port} disabled />
            </div>
          </div>
          <div>
            <Label>Email nadawcy</Label>
            <Input value={settings.email.from || "Nie ustawiono"} disabled />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Jak skonfigurować email:</strong>
              <br />
              Edytuj plik <code className="bg-blue-100 px-1 rounded">
                .env
              </code>{" "}
              i ustaw następujące zmienne:
              <br />
              <code className="bg-blue-100 px-1 rounded">
                EMAIL_SERVER_HOST
              </code>
              ,{" "}
              <code className="bg-blue-100 px-1 rounded">
                EMAIL_SERVER_PORT
              </code>
              ,{" "}
              <code className="bg-blue-100 px-1 rounded">
                EMAIL_SERVER_USER
              </code>
              ,{" "}
              <code className="bg-blue-100 px-1 rounded">
                EMAIL_SERVER_PASSWORD
              </code>
              , <code className="bg-blue-100 px-1 rounded">EMAIL_FROM</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Konfiguracja AI (Google Gemini)
              </CardTitle>
              <CardDescription>
                Ustawienia automatycznego sprawdzania prac
              </CardDescription>
            </div>
            {settings.ai.configured ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Skonfigurowane</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Nieskonfigurowane</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Status API</Label>
            <Input
              value={
                settings.ai.configured
                  ? "Klucz API ustawiony"
                  : "Brak klucza API"
              }
              disabled
            />
          </div>
          <div>
            <Label>Tryb testowy</Label>
            <Input
              value={
                settings.ai.testMode
                  ? "Włączony (mock data)"
                  : "Wyłączony (używa prawdziwego API)"
              }
              disabled
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Jak skonfigurować AI:</strong>
              <br />
              Edytuj plik <code className="bg-blue-100 px-1 rounded">
                .env
              </code>{" "}
              i ustaw:
              <br />
              <code className="bg-blue-100 px-1 rounded">
                GEMINI_API_KEY=twój_klucz_api
              </code>
              <br />
              <code className="bg-blue-100 px-1 rounded">
                AI_TEST_MODE=false
              </code>{" "}
              (aby wyłączyć tryb testowy)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Ustawienia Aplikacji
          </CardTitle>
          <CardDescription>Ogólne informacje o aplikacji</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL Aplikacji</Label>
            <Input value={settings.app.url || "Nie ustawiono"} disabled />
          </div>
          <div>
            <Label>Wersja</Label>
            <Input value="1.0.0" disabled />
          </div>
          <div>
            <Label>Środowisko</Label>
            <Input value={process.env.NODE_ENV || "development"} disabled />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>URL aplikacji:</strong>
              <br />
              Ustaw zmienną{" "}
              <code className="bg-blue-100 px-1 rounded">
                NEXT_PUBLIC_APP_URL
              </code>{" "}
              w pliku <code className="bg-blue-100 px-1 rounded">.env</code>
              <br />
              Przykład:{" "}
              <code className="bg-blue-100 px-1 rounded">
                NEXT_PUBLIC_APP_URL=http://localhost:3000
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Szybkie Akcje</CardTitle>
          <CardDescription>Przydatne narzędzia administracyjne</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                (window.location.href = "/dashboard/admin/users?status=PENDING")
              }
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Zatwierdzanie kont ({settings.statistics.pendingUsers})
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/dashboard/admin/users")}
            >
              <Users className="w-4 h-4 mr-2" />
              Zarządzaj użytkownikami
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                (window.location.href = "/dashboard/admin/courses")
              }
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Zarządzaj kursami
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Informacje o Bazie Danych
          </CardTitle>
          <CardDescription>Status połączenia z bazą danych</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Połączono z PostgreSQL</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Przydatne komendy:</strong>
              <br />
              <code className="bg-gray-200 px-2 py-1 rounded">
                npm run db:studio
              </code>{" "}
              - otwórz Prisma Studio
              <br />
              <code className="bg-gray-200 px-2 py-1 rounded">
                npm run db:push
              </code>{" "}
              - zsynchronizuj schemat
              <br />
              <code className="bg-gray-200 px-2 py-1 rounded">
                npm run db:seed
              </code>{" "}
              - wypełnij bazę danymi testowymi
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
