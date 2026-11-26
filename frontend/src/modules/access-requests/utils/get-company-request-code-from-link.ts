import { COMPANY_REQUEST_CODE_PATTERN } from "../constants/company-request-status.constants";

export function getCompanyRequestCodeFromLink(
  value: string | string[] | null | undefined,
): string | null {
  if (typeof value !== "string") return null;

  const code = value.trim().toUpperCase();

  return COMPANY_REQUEST_CODE_PATTERN.test(code) ? code : null;
}
