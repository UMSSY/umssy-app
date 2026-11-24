export function readAccessTokenSubject(token: unknown): string | null {
  if (typeof token !== 'string') return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const claims: unknown = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );
    if (
      typeof claims === 'object' &&
      claims !== null &&
      'sub' in claims &&
      typeof claims.sub === 'string' &&
      claims.sub.trim().length > 0
    ) {
      return claims.sub;
    }
  } catch {}

  return null;
}
