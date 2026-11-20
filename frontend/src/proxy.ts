import { NextResponse, type NextRequest } from "next/server";
import { buildLoginUrl, SESSION_MARKER_COOKIE_NAME, SESSION_MARKER_COOKIE_VALUE } from "@/modules/auth";

const OFFLINE_SHELL_HEADER = "x-umssy-offline-shell";

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/events/my-passes" &&
    request.cookies.get(SESSION_MARKER_COOKIE_NAME)?.value !== SESSION_MARKER_COOKIE_VALUE &&
    request.headers.get(OFFLINE_SHELL_HEADER) !== "1"
  ) {
    return NextResponse.redirect(new URL(buildLoginUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`), request.url));
  }

  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = { matcher: ["/", "/events/my-passes"] };
