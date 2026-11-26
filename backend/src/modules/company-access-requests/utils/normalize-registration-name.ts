export function normalizeRegistrationName(value: string): string {
  return value.replace(/\s+/gu, ' ').trim().toLowerCase();
}
