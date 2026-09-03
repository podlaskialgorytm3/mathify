import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { HydrationFix } from "@/components/HydrationFix";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export const metadata: Metadata = {
  title: "Mathify - Aplikacja do śledzenia rozwoju matematycznego",
  description:
    "System do zarządzania kursami matematyki i automatycznego sprawdzania prac domowych",
  applicationName: "Mathify",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mathify",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

/**
 * Ustawienia okna dla aplikacji instalowalnej.
 * `viewportFit: "cover"` razem z klasami safe-area sprawia, że treść
 * nie chowa się pod wcięciem aparatu ani paskiem gestów na telefonie.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Inter', sans-serif" }}
        suppressHydrationWarning
      >
        <HydrationFix />
        <ServiceWorkerRegister />
        <OfflineIndicator />
        {children}
        <InstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
