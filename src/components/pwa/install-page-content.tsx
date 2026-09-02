"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, Smartphone, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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

export function InstallPageContent() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppStandalone, setIsAppStandalone] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsAppStandalone(true);
      return;
    }

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
      setIsAppStandalone(true);
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setIsAppStandalone(true);
    }
  }, [deferredPrompt]);

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4 border-b pb-6">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
          <Smartphone className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Aplikacja Mathify
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Zainstaluj platformę jako aplikację na swoim urządzeniu.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Co to znaczy?</h2>
          <p className="text-gray-600 leading-relaxed">
            Mathify to nowoczesna aplikacja internetowa (PWA). Oznacza to, że możesz zainstalować ją bezpośrednio 
            na swoim urządzeniu (telefonie, tablecie lub komputerze) prosto z poziomu przeglądarki, 
            zupełnie jak tradycyjną aplikację ze sklepu.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Dlaczego warto zainstalować?</h2>
          <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <li className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <strong className="block font-medium text-gray-900">Szybki dostęp</strong>
                <span className="text-sm text-gray-500">Ikona Mathify pojawi się na Twoim ekranie głównym lub pulpicie komputera.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <strong className="block font-medium text-gray-900">Pełny ekran</strong>
                <span className="text-sm text-gray-500">Aplikacja uruchamia się bez paska adresu i nawigacji przeglądarki, oferując więcej miejsca na naukę.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <strong className="block font-medium text-gray-900">Lepsze działanie</strong>
                <span className="text-sm text-gray-500">Płynniejsze przełączanie między kartami i lepsze wykorzystanie pamięci podręcznej.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <strong className="block font-medium text-gray-900">Brak zajętego miejsca</strong>
                <span className="text-sm text-gray-500">Aplikacja waży zaledwie ułamek tego co aplikacje ze sklepów App Store czy Google Play.</span>
              </div>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Jak to zrobić?</h2>
          
          {isAppStandalone ? (
            <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-green-900">
                Gratulacje! Korzystasz już z zainstalowanej aplikacji.
              </p>
            </div>
          ) : deferredPrompt ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
              <div className="mb-4 flex items-start gap-3 text-blue-900">
                <Info className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                <p>
                  Twoja przeglądarka obsługuje automatyczną instalację. Kliknij poniższy przycisk, 
                  aby jednym ruchem dodać Mathify do swojego urządzenia.
                </p>
              </div>
              <Button size="lg" onClick={install} className="w-full sm:w-auto shadow-md">
                <Download className="mr-2 h-5 w-5" />
                Zainstaluj aplikację teraz
              </Button>
            </div>
          ) : showIosHint ? (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="mb-6 text-gray-700">
                Na urządzeniach <strong>Apple (iPhone, iPad)</strong> instalacja przebiega nieco inaczej z powodu ograniczeń systemu iOS. Postępuj zgodnie z tą instrukcją:
              </p>
              <ol className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">1</div>
                  <span className="text-gray-700">Stuknij w ikonę udostępniania <Share className="inline-block h-5 w-5 mx-1 text-blue-500" /> na dolnym pasku przeglądarki Safari.</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">2</div>
                  <span className="text-gray-700">Przewiń menu w dół i wybierz opcję <strong>„Do ekranu początkowego”</strong>.</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">3</div>
                  <span className="text-gray-700">W prawym górnym rogu zatwierdź klikając <strong>„Dodaj”</strong>.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
               <div className="flex items-start gap-3 text-gray-600">
                 <Info className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                 <p>
                   Wygląda na to, że używana przeglądarka nie obsługuje automatycznej instalacji PWA 
                   lub aplikacja została już przez Ciebie dodana w inny sposób. Spróbuj poszukać ikony z plusem lub instalacji 
                   po prawej stronie w pasku adresu (np. w Chrome lub Edge na komputerze).
                 </p>
               </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
