/** Decide qué información de contacto puede abandonar el backend. */
export function recruiterContactProjection(
  authorized: boolean,
  email: string | null,
  phone: string | null,
): { email: string | null; phone: string | null } {
  return authorized ? { email, phone } : { email: null, phone: null };
}
