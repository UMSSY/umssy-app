export interface SessionInactivityGuardProps {
  idleTimeoutSeconds?: number;
  warningSeconds?: number;
  absoluteExpiresAt?: string;
}
