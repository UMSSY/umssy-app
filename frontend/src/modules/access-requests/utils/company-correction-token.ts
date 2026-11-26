import {
  COMPANY_CORRECTION_FRAGMENT_KEY,
  COMPANY_CORRECTION_TOKEN_PATTERN,
} from "../constants/company-request-status.constants";

export function isCompanyCorrectionToken(value: unknown): value is string {
  return typeof value === "string" && COMPANY_CORRECTION_TOKEN_PATTERN.test(value);
}

export function getCompanyCorrectionToken(fragment: string): string | null {
  if (!fragment.startsWith("#")) return null;
  const tokens = new URLSearchParams(fragment.slice(1)).getAll(COMPANY_CORRECTION_FRAGMENT_KEY);
  return tokens.length === 1 && isCompanyCorrectionToken(tokens[0]) ? tokens[0] : null;
}

export function removeCompanyCorrectionToken(fragment: string): string {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
  params.delete(COMPANY_CORRECTION_FRAGMENT_KEY);
  const remaining = params.toString();
  return remaining ? `#${remaining}` : "";
}
