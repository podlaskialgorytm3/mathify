import { Metadata } from "next";
import { InstallPageContent } from "@/components/pwa/install-page-content";

export const metadata: Metadata = {
  title: "Aplikacja - Nauczyciel",
};

export default function TeacherAppPage() {
  return <InstallPageContent />;
}
