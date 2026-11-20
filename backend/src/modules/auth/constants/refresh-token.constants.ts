export const REFRESH_REVOCATION_REASONS = {
  logout: 'logout',
  reuseDetected: 'reuse_detected',
  passwordChanged: 'password_changed',
  userInactive: 'user_inactive',
  roleRemoved: 'role_removed',
} as const;

export type RefreshRevocationReason =
  (typeof REFRESH_REVOCATION_REASONS)[keyof typeof REFRESH_REVOCATION_REASONS];

// The refresh cookie is only sent to the auth endpoints (global prefix "api").
export const REFRESH_TOKEN_COOKIE_PATH = '/api/auth';
