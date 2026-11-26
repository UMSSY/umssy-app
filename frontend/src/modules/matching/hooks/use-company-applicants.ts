"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/contexts/auth-context";
import { jobOffersService } from "@/modules/job-offers";
import { getCompanyApplicants } from "../services/matching.service";

export function useCompanyApplicants() {
  const { company, roles, isLoading } = useAuth();
  const companyId = roles.includes("empresa") ? company?.id : undefined;
  const [selectedId, selectOffer] = useState<string | null>(null);
  const vacancies = useQuery({
    queryKey: ["matching", "company-vacancies", companyId],
    queryFn: () => jobOffersService.getByCompany(companyId!),
    enabled: Boolean(companyId),
  });
  const offerId =
    selectedId && vacancies.data?.some((offer) => offer.id === selectedId)
      ? selectedId
      : vacancies.data?.[0]?.id;
  const applicants = useQuery({
    queryKey: ["matching", "applicants", companyId, offerId],
    queryFn: ({ signal }) => getCompanyApplicants(companyId!, offerId!, signal),
    enabled: Boolean(companyId && offerId),
  });
  return { companyId, vacancies, applicants, offerId, selectOffer, isLoading };
}
