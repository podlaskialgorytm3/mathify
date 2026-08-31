import path from "path";

import manifest from "@/app/manifest";
import {
  DASHBOARD_NAVIGATION,
  ROLE_LABELS,
  getPrimaryNavigation,
} from "@/lib/navigation";

// Globalny setup testów mockuje `fs`, a tutaj czytamy realne pliki PWA.
const realFs = jest.requireActual("fs") as typeof import("fs");

describe("PWA - manifest", () => {
  const result = manifest();

  it("jest instalowalny jako osobna aplikacja", () => {
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/dashboard");
    expect(result.scope).toBe("/");
    expect(result.name).toContain("Mathify");
    expect(result.short_name).toBe("Mathify");
  });

  it("zawiera wymagane rozmiary ikon", () => {
    const sizes = (result.icons ?? []).map((icon) => icon.sizes);

    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("zawiera ikonę maskable dla Androida", () => {
    const maskable = (result.icons ?? []).filter(
      (icon) => icon.purpose === "maskable"
    );

    expect(maskable.length).toBeGreaterThanOrEqual(1);
    expect(maskable.map((icon) => icon.sizes)).toContain("512x512");
  });

  it("wskazuje na istniejące pliki ikon", () => {
    for (const icon of result.icons ?? []) {
      const file = path.join(process.cwd(), "public", String(icon.src));
      expect(realFs.existsSync(file)).toBe(true);
    }
  });

  it("ma spójny kolor motywu z paskiem statusu", () => {
    expect(result.theme_color).toBe("#2563eb");
    expect(result.background_color).toBe("#ffffff");
  });
});

describe("PWA - service worker", () => {
  const source = realFs.readFileSync(
    path.join(process.cwd(), "public", "sw.js"),
    "utf8"
  );

  it("obsługuje cykl życia workera", () => {
    expect(source).toContain('addEventListener("install"');
    expect(source).toContain('addEventListener("activate"');
    expect(source).toContain('addEventListener("fetch"');
    expect(source).toContain("skipWaiting()");
    expect(source).toContain("clients.claim()");
  });

  it("ma stronę offline w precache", () => {
    expect(source).toContain('const OFFLINE_URL = "/offline"');
    expect(source).toContain("PRECACHE_URLS");
  });

  it("nie cache'uje odpowiedzi z API", () => {
    expect(source).toContain('url.pathname.startsWith("/api/")');
  });

  it("obsługuje wyłącznie żądania GET z własnego origin", () => {
    expect(source).toContain('request.method !== "GET"');
    expect(source).toContain("url.origin !== self.location.origin");
  });
});

describe("PWA - nawigacja panelu", () => {
  it("każda rola ma zdefiniowaną nawigację i etykietę", () => {
    for (const role of ["ADMIN", "TEACHER", "STUDENT"] as const) {
      expect(DASHBOARD_NAVIGATION[role].length).toBeGreaterThan(0);
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("dolny pasek na telefonie ma maksymalnie cztery pozycje", () => {
    for (const role of ["ADMIN", "TEACHER", "STUDENT"] as const) {
      const primary = getPrimaryNavigation(DASHBOARD_NAVIGATION[role]);

      expect(primary.length).toBeGreaterThan(0);
      expect(primary.length).toBeLessThanOrEqual(4);
      expect(primary[0].href).toBe("/dashboard");
    }
  });

  it("wszystkie odnośniki prowadzą do panelu", () => {
    for (const role of ["ADMIN", "TEACHER", "STUDENT"] as const) {
      for (const item of DASHBOARD_NAVIGATION[role]) {
        expect(item.href.startsWith("/dashboard")).toBe(true);
        expect(item.name.length).toBeGreaterThan(0);
      }
    }
  });
});
