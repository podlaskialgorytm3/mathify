"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Pasek informujący o braku połączenia.
 * W trybie standalone użytkownik nie widzi komunikatów przeglądarki,
 * więc aplikacja musi sama zasygnalizować pracę offline.
 */
export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff className="h-4 w-4" />
      Brak połączenia z internetem. Część funkcji jest niedostępna.
    </div>
  );
}
