"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/vacancies.constants";
import { jobOffersService } from "../services/job-offers.service";

const JOB_OFFER_DETAILS_ERROR = "No se pudieron cargar los detalles de la vacante.";

export function useJobOfferDetails(companyId: string | null, jobOfferId: string | null) {
  const query = useQuery({
    queryKey: JOB_OFFERS_QUERY_KEYS.companyOfferDetails(companyId, jobOfferId),
    queryFn: () => {
      if (!companyId || !jobOfferId) throw new Error(JOB_OFFER_DETAILS_ERROR);
      return jobOffersService.getByCompanyAndId(companyId, jobOfferId);
    },
    enabled: companyId !== null && jobOfferId !== null,
    retry: false,
  });

  return {
    offer: query.data ?? null,
    status: query.isError ? "error" : query.isPending ? "loading" : "ready",
    errorMessage: query.isError
      ? getApiErrorDetail(query.error) ?? JOB_OFFER_DETAILS_ERROR
      : null,
    reload: () => {
      void query.refetch();
    },
  } as const;
}
