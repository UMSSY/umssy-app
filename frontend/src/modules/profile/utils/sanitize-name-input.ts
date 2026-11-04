// Names take letters and the separators of compound names, so digits and symbols are dropped while typing
const ALLOWED_PATTERN = /[\p{L}\p{M} '’-]/u;

export function sanitizeNameInput(value: string): string {
  return [...(value ?? "")].filter((character) => ALLOWED_PATTERN.test(character)).join("");
}
