"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  FileCode,
  FileText,
  LayoutTemplate,
  Puzzle,
} from "lucide-react";

const LATEX_SUBITEMS = [
  {
    name: "Zarządzanie materiałem",
    href: "/dashboard/teacher/latex-editor",
    icon: FileText,
  },
  {
    name: "Zarządzanie szablonami",
    href: "/dashboard/teacher/latex-templates",
    icon: LayoutTemplate,
  },
  {
    name: "Zarządzanie elementami",
    href: "/dashboard/teacher/latex-elements",
    icon: Puzzle,
  },
];

/**
 * Sidebar entry "Edycja i Kompilacja Materiałów" — expands into three options:
 * material management (existing editor), template management, element management.
 */
export function LatexMenuItem() {
  const pathname = usePathname() ?? "";
  const isSectionActive = LATEX_SUBITEMS.some((item) =>
    pathname.startsWith(item.href),
  );
  const [open, setOpen] = useState(isSectionActive);

  return (
    <div>
      <button
        id="sidebar-latex-menu-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-600"
      >
        <FileCode className="mr-3 h-5 w-5" />
        <span className="flex-1 text-left">Edycja i Kompilacja Materiałów</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-4 pl-3 border-l border-gray-200 space-y-1">
          {LATEX_SUBITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-2 py-2 text-sm rounded-md hover:bg-blue-50 hover:text-blue-600 ${
                pathname.startsWith(item.href)
                  ? "text-blue-600 bg-blue-50 font-medium"
                  : "text-gray-600"
              }`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
