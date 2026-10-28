"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { TOAST_OPTIONS, VACANCY_LIST_TEXT } from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { CompanyJobOffersStatus } from "../types/company-job-offers-status.types";
import type { JobOfferFilters } from "../types/job-offer-filters.types";
import type { JobOfferListScope } from "../types/job-offer-list-scope.types";
import { selectVisibleOffers, toListParams } from "../utils/filter-job-offers";
import { getCurrentCompany } from "../utils/get-current-company";

export function useCompanyJobOffers(
  filters: JobOfferFilters,
  scope: JobOfferListScope = "published",
) {
  const companyId = getCurrentCompany().id;
  const params = toListParams(filters);

  const query = useQuery({
    queryKey: JOB_OFFERS_QUERY_KEYS.companyOffers(companyId, params),
    queryFn: () => jobOffersService.getByCompany(companyId as string, params),
    enabled: companyId !== null,
    placeholderData: keepPreviousData,
    select: (offers) => selectVisibleOffers(offers, scope, filters),
  });

  // Aviso temporal ante un fallo de red o del servidor; el listado muestra además el botón de reintento.
  useEffect(() => {
    if (query.isError) toast.error(VACANCY_LIST_TEXT[scope].loadError, TOAST_OPTIONS);
  }, [query.isError, query.errorUpdatedAt, scope]);

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
