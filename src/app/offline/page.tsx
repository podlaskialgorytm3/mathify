"use client";

import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <WifiOff className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Jesteś offline</h1>
        <p className="text-gray-600">
          Nie udało się połączyć z Mathify. Sprawdź połączenie z internetem
          i spróbuj ponownie.
        </p>
        <Button className="w-full" onClick={() => window.location.reload()}>
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
}
