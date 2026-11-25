import { normalizeCvMatchText } from "./normalize-cv-match-text";

export function toCvMatchKey(...parts: readonly (string | null | undefined)[]): string | null {
  const normalized = (parts ?? []).map(normalizeCvMatchText);
  return normalized.every((part) => part.length === 0) ? null : JSON.stringify(normalized);
}
