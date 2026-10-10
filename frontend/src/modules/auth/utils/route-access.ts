import { OFFLINE_ROUTES, PUBLIC_ROUTES } from "../constants/session.constants";

const matchesRoute = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isOfflinePath(pathname: string): boolean {
  return OFFLINE_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isOpenPath(pathname: string): boolean {
  return isPublicPath(pathname) || isOfflinePath(pathname);
}
