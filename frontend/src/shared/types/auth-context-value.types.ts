import type { RoleTag } from "./role-tag.types";

export interface AuthContextValue {
  currentUserId: string | null;
  company?: { id: string; name: string } | null;
  roles: readonly RoleTag[];
  isLoading: boolean;
  isAuthenticated?: boolean;
  idleTimeoutSeconds?: number;
  warningSeconds?: number;
  absoluteExpiresAt?: string;
  refreshRoles: () => Promise<void>;
}
