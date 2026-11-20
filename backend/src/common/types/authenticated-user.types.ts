export interface AuthenticatedUser {
  id: string;
  company?: { id: string; name: string } | null;
  userId?: string;
  email: string;
  roles: string[];
  roleTag?: string;
}
