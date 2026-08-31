"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "mathify-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Zachęta do zainstalowania aplikacji.
 *
 * Na Androidzie i desktopie korzystamy ze zdarzenia `beforeinstallprompt`.
 * Safari na iOS go nie wspiera, więc pokazujemy tam krótką instrukcję
 * „Udostępnij → Do ekranu początkowego”.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) {
      return;
    }

    if (window.localStorage.getItem(DISMISSED_KEY) === "1") {
      return;
    }

    setDismissed(false);

    if (isIos()) {
      setShowIosHint(true);
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const close = useCallback(() => {
    setDismissed(true);
    window.localStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      close();
    }
  }, [close, deferredPrompt]);

  if (dismissed || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4 sm:w-80">
      <button
        type="button"
        onClick={close}
        aria-label="Zamknij"
        className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="pr-6 text-sm font-semibold text-gray-900">
        Zainstaluj Mathify na telefonie
      </p>

      {deferredPrompt ? (
        <>
          <p className="mt-1 text-xs text-gray-500">
            Aplikacja uruchomi się w osobnym oknie, bez paska przeglądarki.
          </p>
          <Button size="sm" className="mt-3 w-full" onClick={install}>
            <Download className="mr-2 h-4 w-4" />
            Zainstaluj
          </Button>
        </>
      ) : (
        <p className="mt-1 flex items-start gap-2 text-xs text-gray-500">
          <Share className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            W Safari dotknij ikony udostępniania, a następnie wybierz „Do ekranu
            początkowego”.
          </span>
        </p>
      )}
    </div>
  );
}
