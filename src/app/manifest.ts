import type { MetadataRoute } from "next";

/**
 * Manifest aplikacji instalowalnej (PWA).
 * Trzymamy go jako trasę metadanych Next.js, dzięki czemu jest typowany
 * i zawsze serwowany z poprawnym nagłówkiem Content-Type.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mathify - platforma do nauki matematyki",
    short_name: "Mathify",
    description:
      "Kursy matematyki, prace domowe i statystyki postępów w jednej aplikacji.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "pl",
    dir: "ltr",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Panel główny",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Moje kursy",
        url: "/dashboard/student/courses",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Statystyki",
        url: "/dashboard/student/statistics",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
