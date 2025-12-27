import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { HydrationFix } from "@/components/HydrationFix";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className} suppressHydrationWarning>
        <HydrationFix />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
