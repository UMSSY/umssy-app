export function getRequestCodeFromLink(
  value: string | string[] | null | undefined,
): string | null {
  if (typeof value !== "string") return null;

  const code = value.trim().toUpperCase();

  return /^SOL-[0-9]{4}-[0-9]{4,}$/.test(code) ? code : null;
}
