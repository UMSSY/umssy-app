const VISIBLE_CHARS = 2;
const MASK = '•••';

// ana.perez@gmail.com -> an•••@gmail.com
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return MASK;
  return `${local.slice(0, VISIBLE_CHARS)}${MASK}@${domain}`;
}
