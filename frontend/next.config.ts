import type { NextConfig } from "next";

function getCspHeader(): string {
  const apiUrlEnv =
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    process.env.NEXT_PUBLIC_API_URL_DEV ||
    process.env.NEXT_PUBLIC_API_URL_PROD ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

  let originFromApi = "";
  try {
    const url = new URL(apiUrlEnv);
    originFromApi = url.origin;
  } catch {
    originFromApi = "";
  }

  const connectSources = [
    "'self'",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "ws://localhost:8080",
    "ws://127.0.0.1:8080",
    "https:",
    "wss:",
    originFromApi,
  ]
    .filter(Boolean)
    .join(" ");

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSources}`,
    "media-src 'self' data: blob: https:",
    "object-src 'self' blob:",
    "frame-src 'self' blob: data:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return cspDirectives.join("; ");
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: getCspHeader(),
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
