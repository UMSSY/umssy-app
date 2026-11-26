import { afterEach, describe, it, expect } from "vitest";
import nextConfig, { buildCspHeader, securityHeaders } from "../../../next.config";

describe("next.config security headers", () => {
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
    expect(value).toContain("img-src 'self' data: blob:");
    expect(value).toContain("object-src 'self' blob:");
    expect(value).toContain("frame-src 'self' blob: data:");
    expect(value).toContain("connect-src");
    expect(value).toContain("frame-ancestors 'none'");
  });

  describe("buildCspHeader", () => {
    const directive = (csp: string, name: string) =>
      csp.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";

    it("en producción quita unsafe-eval y conserva unsafe-inline", () => {
      const csp = buildCspHeader({
        nodeEnv: "production",
        appEnv: "dev",
        apiUrl: "https://epic1-api-umssy.zer4c.dev/api",
      });

      expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    });

    it("en producción limita connect-src al API y su WebSocket sin comodines", () => {
      const csp = buildCspHeader({
        nodeEnv: "production",
        appEnv: "dev",
        apiUrl: "https://epic1-api-umssy.zer4c.dev/api",
      });

      expect(directive(csp, "connect-src")).toBe(
        "connect-src 'self' https://epic1-api-umssy.zer4c.dev wss://epic1-api-umssy.zer4c.dev",
      );
      expect(directive(csp, "connect-src")).not.toMatch(/\s(?:https|wss):(?:\s|$)|localhost|127\.0\.0\.1/);
    });

    it("en producción deriva ws para un API http", () => {
      const csp = buildCspHeader({ nodeEnv: "production", appEnv: "dev", apiUrl: "http://api.interna.test:3001/api" });

      expect(directive(csp, "connect-src")).toBe(
        "connect-src 'self' http://api.interna.test:3001 ws://api.interna.test:3001",
      );
    });

    it("img-src y media-src incluyen el API y media-src no admite https genérico", () => {
      const csp = buildCspHeader({
        nodeEnv: "production",
        appEnv: "dev",
        apiUrl: "https://dev-backend-umssy-app.zer4c.dev/api",
      });

      expect(directive(csp, "img-src")).toBe(
        "img-src 'self' data: blob: https://dev-backend-umssy-app.zer4c.dev https:",
      );
      expect(directive(csp, "media-src")).toBe(
        "media-src 'self' data: blob: https://dev-backend-umssy-app.zer4c.dev",
      );
    });

    it("en desarrollo permite unsafe-eval y los localhost", () => {
      const csp = buildCspHeader({ nodeEnv: "development", apiUrl: "http://localhost:8080/api" });

      expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
      const connect = directive(csp, "connect-src");
      expect(connect).toContain("http://localhost:8080");
      expect(connect).toContain("http://127.0.0.1:8080");
      expect(connect).toContain("ws://localhost:8080");
      expect(connect).toContain("ws://127.0.0.1:8080");
    });

    it("con un API remoto en desarrollo también habilita localhost", () => {
      const csp = buildCspHeader({
        nodeEnv: "development",
        apiUrl: "https://epic1-api-umssy.zer4c.dev/api",
      });

      expect(directive(csp, "connect-src")).toContain("ws://localhost:8080");
      expect(directive(csp, "connect-src")).toContain("wss://epic1-api-umssy.zer4c.dev");
    });

    it("en producción con API local mantiene localhost sin unsafe-eval", () => {
      const csp = buildCspHeader({ nodeEnv: "production", apiUrl: "http://localhost:8080/api" });

      expect(directive(csp, "script-src")).not.toContain("'unsafe-eval'");
      expect(directive(csp, "connect-src")).toBe(
        "connect-src 'self' http://localhost:8080 ws://localhost:8080 http://127.0.0.1:8080 ws://127.0.0.1:8080",
      );
    });

    it("con una URL de API inválida en producción solo permite el propio origen", () => {
      const csp = buildCspHeader({ nodeEnv: "production", appEnv: "dev", apiUrl: "no-es-una-url" });

      expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
    });

    describe("origen del API según NEXT_PUBLIC_APP_ENV", () => {
      const originalEnv = { ...process.env };
      const deployVars = (appEnv: string, remoteApi: string) => {
        process.env.NEXT_PUBLIC_APP_ENV = appEnv;
        process.env.NEXT_PUBLIC_API_URL_LOCAL = "http://localhost:8080/api";
        process.env.NEXT_PUBLIC_API_URL_DEV = remoteApi;
        process.env.NEXT_PUBLIC_API_URL_PROD = remoteApi;
      };

      afterEach(() => {
        process.env = { ...originalEnv };
      });

      it.each([
        ["dev", "dev-api-umssy.zer4c.dev"],
        ["dev", "epic1-api-umssy.zer4c.dev"],
        ["prod", "umssy.zer4c.dev"],
      ])("con APP_ENV=%s en producción permite %s y no incluye localhost", (appEnv, host) => {
        deployVars(appEnv, `https://${host}/api`);

        const connect = directive(buildCspHeader({ nodeEnv: "production" }), "connect-src");

        expect(connect).toContain(`https://${host}`);
        expect(connect).toContain(`wss://${host}`);
        expect(connect).not.toMatch(/localhost|127\.0\.0\.1/);
      });

      it("con APP_ENV=local en producción mantiene localhost", () => {
        deployVars("local", "https://dev-api-umssy.zer4c.dev/api");

        const connect = directive(buildCspHeader({ nodeEnv: "production" }), "connect-src");

        expect(connect).toContain("http://localhost:8080");
        expect(connect).toContain("ws://localhost:8080");
        expect(connect).not.toContain("dev-api-umssy");
      });

      it("sin APP_ENV usa local y sin variable cae en localhost:8080", () => {
        delete process.env.NEXT_PUBLIC_APP_ENV;
        delete process.env.NEXT_PUBLIC_API_URL_LOCAL;

        const connect = directive(buildCspHeader({ nodeEnv: "production" }), "connect-src");

        expect(connect).toContain("http://localhost:8080");
      });

      it("con APP_ENV dev sin su variable cae en localhost:8080", () => {
        process.env.NEXT_PUBLIC_APP_ENV = "dev";
        delete process.env.NEXT_PUBLIC_API_URL_DEV;

        const connect = directive(buildCspHeader({ nodeEnv: "production" }), "connect-src");

        expect(connect).toContain("http://localhost:8080");
      });

      it("en desarrollo con APP_ENV=dev permite unsafe-eval y localhost junto al API real", () => {
        deployVars("dev", "https://dev-api-umssy.zer4c.dev/api");

        const csp = buildCspHeader({ nodeEnv: "development" });

        expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
        expect(directive(csp, "connect-src")).toContain("ws://localhost:8080");
        expect(directive(csp, "connect-src")).toContain("wss://dev-api-umssy.zer4c.dev");
      });
    });

    it("no habilita el SDK de Google en script-src ni frame-src", () => {
      const csp = buildCspHeader({ nodeEnv: "production", appEnv: "dev", apiUrl: "https://api.test/api" });

      expect(csp).not.toContain("accounts.google.com");
    });

    it("conserva las directivas que no se endurecen", () => {
      const csp = buildCspHeader({ nodeEnv: "production", appEnv: "dev", apiUrl: "https://api.test/api" });

      expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
      expect(csp).toContain("font-src 'self' https://fonts.gstatic.com data:");
      expect(csp).toContain("object-src 'self' blob:");
      expect(csp).toContain("frame-src 'self' blob: data:");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
    });
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

