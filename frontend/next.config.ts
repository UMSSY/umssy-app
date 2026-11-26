import type { NextConfig } from "next";

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];

const LOCAL_CONNECT_SOURCES = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "ws://localhost:8080",
  "ws://127.0.0.1:8080",
];

type AppEnv = "local" | "dev" | "prod";

interface CspEnvironment {
  nodeEnv?: string;
  appEnv?: string;
  apiUrl?: string;
}

const DEFAULT_API_URL = "http://localhost:8080";

function resolveAppEnv(): string {
  return process.env.NEXT_PUBLIC_APP_ENV || "local";
}

function resolveApiUrl(appEnv: string): string {
  const urls: Record<AppEnv, string | undefined> = {
    local: process.env.NEXT_PUBLIC_API_URL_LOCAL,
    dev: process.env.NEXT_PUBLIC_API_URL_DEV,
    prod: process.env.NEXT_PUBLIC_API_URL_PROD,
  };
  return urls[appEnv as AppEnv] || DEFAULT_API_URL;
}

function parseApiOrigin(apiUrl: string): { origin: string; socketOrigin: string; isLocal: boolean } | null {
  try {
    const url = new URL(apiUrl);
    return {
      origin: url.origin,
      socketOrigin: url.origin.replace(/^http/, "ws"),
      isLocal: LOCAL_HOSTNAMES.includes(url.hostname),
    };
  } catch {
    return null;
  }
}

export function buildCspHeader({
  nodeEnv = process.env.NODE_ENV,
  appEnv = resolveAppEnv(),
  apiUrl = resolveApiUrl(appEnv),
}: CspEnvironment = {}): string {
  const isProduction = nodeEnv === "production";
  const api = parseApiOrigin(apiUrl);
  const apiSources = api ? [api.origin, api.socketOrigin] : [];
  const allowLocalhost = !isProduction || appEnv === "local" || Boolean(api?.isLocal);

  const scriptSources = ["'self'", ...(isProduction ? [] : ["'unsafe-eval'"]), "'unsafe-inline'"];
  const connectSources = ["'self'", ...apiSources, ...(allowLocalhost ? LOCAL_CONNECT_SOURCES : [])];
  const assetSources = ["'self'", "data:", "blob:", ...(api ? [api.origin] : [])];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src ${[...assetSources, "https:"].join(" ")}`,
    `connect-src ${[...new Set(connectSources)].join(" ")}`,
    `media-src ${assetSources.join(" ")}`,
    "object-src 'self' blob:",
    "frame-src 'self' blob: data:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildCspHeader(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.100.5", "localhost", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
