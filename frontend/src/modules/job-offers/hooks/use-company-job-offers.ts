"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/vacancies.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { JobOfferListScope } from "../types/job-offer.types";
import {
  selectVisibleOffers,
  toListParams,
  type JobOfferFilters,
} from "../utils/filter-job-offers";
import { getCurrentCompany } from "../utils/get-current-company";

export type CompanyJobOffersStatus = "loading" | "ready" | "error";

export function useCompanyJobOffers(
  filters: JobOfferFilters,
  scope: JobOfferListScope = "published",
) {
  const companyId = getCurrentCompany().id;
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const params = toListParams({
    ...filters,
    search: scope === "history" ? "" : debouncedSearch,
  });

  const query = useQuery({
    queryKey: JOB_OFFERS_QUERY_KEYS.companyOffers(companyId, params),
    queryFn: () => jobOffersService.getByCompany(companyId as string, params),
    enabled: companyId !== null,
    placeholderData: keepPreviousData,
    select: (offers) => selectVisibleOffers(offers, scope, filters),
  });

  const status: CompanyJobOffersStatus =
    companyId === null || query.isError ? "error" : query.isPending ? "loading" : "ready";

  return {
    companyId,
    offers: query.data ?? [],
    status,
    reload: () => {
      void query.refetch();
    },
  };
}