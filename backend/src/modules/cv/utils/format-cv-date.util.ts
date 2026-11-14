export function formatCvDate(
  value: Date | string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().substring(0, 10);
  }
  const str = String(value).trim();
  if (!str) {
    return null;
  }
  return str.length >= 10 ? str.substring(0, 10) : str;
}
