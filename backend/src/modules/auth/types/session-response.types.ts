export interface SessionResponse {
  id: string;
  company?: { id: string; name: string } | null;
  email: string;
  roles: string[];
}
