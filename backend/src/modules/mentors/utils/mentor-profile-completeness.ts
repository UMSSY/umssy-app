/** Normalizes text for evaluation without changing the persisted profile. */
export function normalizeProfileText(value: string | null): string {
  return value?.trim() ?? '';
}
