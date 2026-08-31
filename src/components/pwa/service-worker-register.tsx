"use client";

import { useEffect } from "react";

/**
 * Rejestruje service workera po załadowaniu strony.
 *
 * Rejestrujemy dopiero po zdarzeniu `load`, żeby nie konkurować
 * o pasmo z pierwszym renderowaniem, i tylko w produkcji, bo w trybie
 * deweloperskim cache zasobów Next.js przeszkadza w hot reloadzie.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Nie udało się zarejestrować service workera:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
