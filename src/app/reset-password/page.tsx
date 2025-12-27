"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Lock } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "form" | "loading" | "success" | "error"
  >("form");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (!urlToken) {
      setStatus("error");
      setMessage("Brak tokenu resetowania hasła");
    } else {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setMessage("Hasło musi mieć co najmniej 6 znaków");
      setStatus("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Hasła nie są identyczne");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/profile/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Hasło zostało pomyślnie zmienione");

        // Przekieruj do logowania po 3 sekundach
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const error = await response.json();
        setStatus("error");
        setMessage(error.error || "Nie udało się zmienić hasła");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Błąd połączenia z serwerem");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            Resetowanie hasła
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "form" && token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="p-3 rounded bg-red-50 text-red-800 border border-red-200 text-sm">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nowe hasło
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 znaków"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potwierdź nowe hasło
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Powtórz hasło"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Ustaw nowe hasło
              </Button>
            </form>
          )}

          {status === "loading" && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
              <p className="text-gray-600">Zmienianie hasła...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
              <p className="text-gray-900 font-semibold">{message}</p>
              <p className="text-sm text-gray-600">
                Za chwilę zostaniesz przekierowany do strony logowania.
              </p>
              <p className="text-sm text-gray-600">
                Zaloguj się używając nowego hasła.
              </p>
            </div>
          )}

          {status === "error" && !token && (
            <div className="text-center space-y-4 py-8">
              <XCircle className="w-12 h-12 mx-auto text-red-600" />
              <p className="text-gray-900 font-semibold">Błąd</p>
              <p className="text-gray-600">{message}</p>
              <Button
                onClick={() => router.push("/dashboard/profile")}
                className="mt-4"
              >
                Wróć do profilu
              </Button>
            </div>
          )}

          {status === "error" && token && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-red-50 text-red-800 border border-red-200 text-sm text-center">
                {message}
              </div>
              <Button
                onClick={() => {
                  setStatus("form");
                  setMessage("");
                }}
                variant="outline"
                className="w-full"
              >
                Spróbuj ponownie
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
