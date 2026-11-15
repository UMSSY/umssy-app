export interface SessionResponse {
  id: string;
  company?: { id: string; name: string } | null;
  email: string;
  roles: string[];
  idleTimeoutSeconds: number;
  warningSeconds: number;
  absoluteExpiresAt: string | null;
}
