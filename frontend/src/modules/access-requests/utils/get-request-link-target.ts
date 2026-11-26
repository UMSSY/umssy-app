import type { RequestLinkTarget } from "../types/request-link-target.types";
import { getCompanyRequestCodeFromLink } from "./get-company-request-code-from-link";
import { getRequestCodeFromLink } from "./get-request-code-from-link";

export function getRequestLinkTarget(
  value: string | string[] | null | undefined,
): RequestLinkTarget | null {
  const studentCode = getRequestCodeFromLink(value);
  if (studentCode) return { kind: "student", code: studentCode };

  const companyCode = getCompanyRequestCodeFromLink(value);
  if (companyCode) return { kind: "company", code: companyCode };

  return null;
}
