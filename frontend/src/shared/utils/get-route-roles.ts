import { APP_ROUTE_ACCESS } from "@/shared/config/route-access.config";
import type { RoleTag } from "@/shared/types/role-tag.types";

export function getRouteRoles(pathname: string): readonly RoleTag[] {
  const routePath = pathname.split(/[?#]/, 1)[0];
  return APP_ROUTE_ACCESS.find(({ pattern }) => pattern.test(routePath))?.roles ?? [];
}
