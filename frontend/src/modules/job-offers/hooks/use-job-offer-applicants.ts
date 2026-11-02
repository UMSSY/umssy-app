"use client";

import { useQuery } from "@tanstack/react-query";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import { getCurrentCompany } from "../utils/get-current-company";

export function useJobOfferApplicants(jobOfferId: string) {
  const companyId = getCurrentCompany().id;

  return useQuery({
    queryKey: JOB_OFFERS_QUERY_KEYS.companyOfferApplicants(companyId, jobOfferId),
    queryFn: () => jobOffersService.getApplicants(companyId as string, jobOfferId),
    enabled: companyId !== null,
    retry: false,
  });
}
