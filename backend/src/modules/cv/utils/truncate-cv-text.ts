export function truncateCvText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed.slice(0, maxLength).trim() : null;
}
