import { describe, it, expect } from "vitest";
import nextConfig, { securityHeaders } from "../../../next.config";

describe("next.config security headers (HU15 - CA3)", () => {
  it("exporta cabeceras de seguridad requeridas", () => {
    const keys = securityHeaders.map((header) => header.key);
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("Referrer-Policy");
    expect(keys).toContain("Permissions-Policy");
    expect(keys).toContain("X-DNS-Prefetch-Control");
  });

  it("configura X-Frame-Options en DENY", () => {
    const frameOptions = securityHeaders.find(
      (h) => h.key === "X-Frame-Options",
    );
    expect(frameOptions?.value).toBe("DENY");
  });

  it("configura X-Content-Type-Options en nosniff", () => {
    const contentTypeOptions = securityHeaders.find(
      (h) => h.key === "X-Content-Type-Options",
    );
    expect(contentTypeOptions?.value).toBe("nosniff");
  });

  it("configura Referrer-Policy en strict-origin-when-cross-origin", () => {
    const referrerPolicy = securityHeaders.find(
      (h) => h.key === "Referrer-Policy",
    );
    expect(referrerPolicy?.value).toBe("strict-origin-when-cross-origin");
  });

  it("restringe APIs sensibles en Permissions-Policy", () => {
    const permissions = securityHeaders.find(
      (h) => h.key === "Permissions-Policy",
    );
    expect(permissions?.value).toContain("camera=()");
    expect(permissions?.value).toContain("microphone=()");
    expect(permissions?.value).toContain("geolocation=()");
  });

  it("configura CSP con soporte para Google Fonts, imágenes, visores de PDF y connect-src", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    const value = csp?.value ?? "";

    expect(value).toContain("default-src 'self'");
    expect(value).toContain("https://fonts.googleapis.com");
    expect(value).toContain("https://fonts.gstatic.com");
    expect(value).toContain("img-src 'self' data: blob: https:");
    expect(value).toContain("object-src 'self' blob:");
    expect(value).toContain("frame-src 'self' blob: data:");
    expect(value).toContain("connect-src");
    expect(value).toContain("http://localhost:8080");
    expect(value).toContain("frame-ancestors 'none'");
  });

  it("aplica los security headers a todas las rutas mediante nextConfig.headers()", async () => {
    expect(nextConfig.headers).toBeDefined();
    if (nextConfig.headers) {
      const headerRules = await nextConfig.headers();
      expect(headerRules).toHaveLength(1);
      expect(headerRules[0].source).toBe("/:path*");
      expect(headerRules[0].headers).toEqual(securityHeaders);
    }
  });
});

