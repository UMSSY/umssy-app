"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentCompany } from "@/modules/job-offers";
import { useAuth } from "@/shared/contexts/auth-context";
import { companyProfileService } from "../services/company-profile.service";
import type { CompanyProfileStatus } from "../types/company-profile-status.types";

export function useCompanyProfile() {
  const { isLoading } = useAuth();
  const companyId = useCurrentCompany().id;

  const query = useQuery({
    queryKey: ["company-profile", companyId],
    queryFn: () => companyProfileService.getProfile(companyId as string),
    enabled: companyId !== null,
  });

  const status: CompanyProfileStatus =
    !isLoading && companyId === null
      ? "no-company"
      : query.isError
        ? "error"
        : query.isSuccess
          ? "ready"
          : "loading";

  return {
    profile: query.data ?? null,
    status,
    reload: () => {
      void query.refetch();
    },
  };
}
