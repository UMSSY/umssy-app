import { DOCUMENT_CORRECTION_TOKEN_PATTERN } from "../constants/document-correction.constants";

export function isDocumentCorrectionToken(value: unknown): value is string {
  return typeof value === "string" && DOCUMENT_CORRECTION_TOKEN_PATTERN.test(value);
}

export function getDocumentCorrectionToken(fragment: string): string | null {
  if (!fragment.startsWith("#")) return null;
  const params = new URLSearchParams(fragment.slice(1));
  const tokens = params.getAll("correctionToken");
  return tokens.length === 1 && isDocumentCorrectionToken(tokens[0]) ? tokens[0] : null;
}

export function removeDocumentCorrectionToken(fragment: string): string {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
  params.delete("correctionToken");
  const remaining = params.toString();
  return remaining ? `#${remaining}` : "";
}
