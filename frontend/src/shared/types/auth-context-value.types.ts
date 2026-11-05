import type { RoleTag } from "./role-tag.types";

export interface AuthContextValue {
  currentUserId: string | null;
  roles: readonly RoleTag[];
  isLoading: boolean;
  refreshRoles: () => Promise<void>;
}
