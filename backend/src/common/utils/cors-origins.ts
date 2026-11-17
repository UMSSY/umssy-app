export function parseCorsOrigins(
  value: string | undefined = process.env.CORS_ORIGIN,
): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
