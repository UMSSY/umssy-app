import type { RoleTag } from "./auth-types";

export interface SessionResponse {
  id: string;
  email: string;
  company?: { id: string; name: string } | null;
  roles: RoleTag[];
}
