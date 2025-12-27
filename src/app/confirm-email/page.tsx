"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Brak tokenu potwierdzającego");
      return;
    }

    confirmEmailChange(token);
  }, [searchParams]);

  const confirmEmailChange = async (token: string) => {
    try {
      const response = await fetch("/api/profile/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus("success");
        setMessage(`Email został pomyślnie zmieniony na: ${data.newEmail}`);

        // Przekieruj do logowania po 3 sekundach
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const error = await response.json();
        setStatus("error");
        setMessage(error.error || "Nie udało się potwierdzić zmiany emaila");
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
          <CardTitle className="text-center">
            Potwierdzenie zmiany emaila
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                <p className="text-gray-600">Potwierdzanie zmiany emaila...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                <p className="text-gray-900 font-semibold">{message}</p>
                <p className="text-sm text-gray-600">
                  Za chwilę zostaniesz przekierowany do strony logowania.
                </p>
                <p className="text-sm text-gray-600">
                  Zaloguj się ponownie używając nowego adresu email.
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-12 h-12 mx-auto text-red-600" />
                <p className="text-gray-900 font-semibold">Błąd</p>
                <p className="text-gray-600">{message}</p>
                <Button
                  onClick={() => router.push("/dashboard/profile")}
                  className="mt-4"
                >
                  Wróć do profilu
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
