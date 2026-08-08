import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { HydrationFix } from "@/components/HydrationFix";

export const metadata: Metadata = {
  title: "Mathify - Aplikacja do śledzenia rozwoju matematycznego",
  description:
    "System do zarządzania kursami matematyki i automatycznego sprawdzania prac domowych",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
