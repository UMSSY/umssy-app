export const CHAT_ALLOWED_ROLES = ['estudiante', 'titulado'] as const;
export const CHAT_APPLICATION_CONTEXT_TYPE = 'POSTULACION';

const allowedRoles = new Set<string>(CHAT_ALLOWED_ROLES);

export function isChatRoleAllowed(role: string): boolean {
  return allowedRoles.has(role.trim().toLowerCase());
}

export function hasOnlyChatAllowedRoles(roles: readonly string[]): boolean {
  return roles.length > 0 && roles.every(isChatRoleAllowed);
}
