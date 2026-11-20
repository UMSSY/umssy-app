import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

const BASE_ORIGIN = "http://localhost:3000";

function callProxy(path: string, cookieValue?: string) {
  const headers = cookieValue ? { cookie: `umssy_session=${cookieValue}` } : undefined;
  return proxy(new NextRequest(`${BASE_ORIGIN}${path}`, { headers }));
}

describe("Root proxy", () => {
  it("serves the public landing page to anonymous visitors", () => {
    const response = callProxy("/");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["1", "0"])("keeps the landing public when the session marker is %s", (marker) => {
    const response = callProxy("/", marker);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("matches the public root and the private passes route", () => {
    expect(config.matcher).toEqual(["/", "/events/my-passes"]);
  });

  it.each(["/login", "/request-access", "/future-public-page", "/profile", "/chat", "/backoffice/solicitudes"])("does not apply a global session check to %s", (pathname) => {
    const response = callProxy(pathname);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects a logged-out direct visit to Mis inscripciones before rendering", () => {
    const response = callProxy("/events/my-passes");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${BASE_ORIGIN}/login?next=%2Fevents%2Fmy-passes`,
    );
  });

  it("keeps Mis inscripciones reachable when the session marker exists", () => {
    const response = callProxy("/events/my-passes", "1");

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows anonymous service worker shell precaching without a session cookie", () => {
    const response = proxy(new NextRequest(`${BASE_ORIGIN}/events/my-passes`, {
      headers: { "x-umssy-offline-shell": "1" },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves the requested route and query when redirecting to login", () => {
    const response = callProxy("/events/my-passes?tab=historial");

    expect(response.headers.get("location")).toBe(
      `${BASE_ORIGIN}/login?next=%2Fevents%2Fmy-passes%3Ftab%3Dhistorial`,
    );
  });
});
