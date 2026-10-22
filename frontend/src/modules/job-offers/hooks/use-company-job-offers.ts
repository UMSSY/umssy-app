"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { JOB_OFFERS_QUERY_KEYS, PUBLISHED_STATUS } from "../constants/vacancies.constants";
import { jobOffersService } from "../services/job-offers.service";
import { toListParams, type JobOfferFilters } from "../utils/filter-job-offers";
import { getCurrentCompany } from "../utils/get-current-company";

export type CompanyJobOffersStatus = "loading" | "ready" | "error";

export function useCompanyJobOffers(filters: JobOfferFilters) {
  const companyId = getCurrentCompany().id;
  const search = useDebouncedValue(filters.search, 300);
  const params = toListParams({ ...filters, search });

  const query = useQuery({
    queryKey: JOB_OFFERS_QUERY_KEYS.companyOffers(companyId, params),
    queryFn: () => jobOffersService.getByCompany(companyId as string, params),
    enabled: companyId !== null,
    placeholderData: keepPreviousData,
    select: (offers) => offers.filter((offer) => offer.status === PUBLISHED_STATUS),
  });

  const status: CompanyJobOffersStatus =
    companyId === null || query.isError ? "error" : query.isPending ? "loading" : "ready";

  return {
    offers: query.data ?? [],
    status,
    reload: () => {
      void query.refetch();
    },
  };
}

