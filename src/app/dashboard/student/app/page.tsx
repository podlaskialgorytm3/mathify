import { Metadata } from "next";
import { InstallPageContent } from "@/components/pwa/install-page-content";

export const metadata: Metadata = {
  title: "Aplikacja - Uczeń",
};

export default function StudentAppPage() {
  return <InstallPageContent />;
}
