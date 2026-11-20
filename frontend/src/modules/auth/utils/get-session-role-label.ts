import { ROLE_LABELS } from "@/shared/constants/roles.constants";
import { getSessionRoles } from "./get-session-roles";
import type { RoleTag } from "../types/auth-types";

export function getSessionRoleLabel(accessToken: string): string {
  const roles = getSessionRoles(accessToken);
  return getRolesLabel(roles);
}

export function getRolesLabel(roles: readonly RoleTag[]): string {
  return roles.length ? roles.map((role) => ROLE_LABELS[role]).join(" · ") : "Usuario autenticado";
}
