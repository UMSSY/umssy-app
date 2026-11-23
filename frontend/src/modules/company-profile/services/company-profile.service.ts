import { MOCK_COMPANY_PROFILE } from "../constants/company-mock.data";
import type { CompanyProfile } from "../types/company-profile.types";

const DEFAULT_PROFILE_TIMEOUT_MS = 2000;

export function sanitizeExternalWebsiteUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "#") {
    return null;
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return MOCK_COMPANY_PROFILE;
}

export async function getCompanyProfileWithTimeout(
  companyId: string,
  externalSignal?: AbortSignal,
  timeoutMs: number = DEFAULT_PROFILE_TIMEOUT_MS
): Promise<CompanyProfile> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(`/api/companies/${encodeURIComponent(companyId)}/main-profile`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP_ERROR_${response.status}`);
    }

    const payload = (await response.json()) as Partial<CompanyProfile> & {
      website?: string | null;
      web?: string | null;
      logoUrl?: string | null;
    };

    const rawWebsite = payload.website ?? payload.web ?? null;

    return {
      ...(payload as CompanyProfile),
      website: sanitizeExternalWebsiteUrl(rawWebsite),
    };
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onAbort);
  }
}