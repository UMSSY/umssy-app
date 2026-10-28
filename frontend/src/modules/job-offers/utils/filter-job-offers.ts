import { HISTORY_STATUSES, PUBLISHED_STATUS } from "../constants/job-offers.constants";
import type { JobOffer } from "../types/job-offer.types";
import type { JobOfferListScope } from "../types/job-offer-list-scope.types";
import { normalizeSearchText } from "@/shared/utils/normalize-search-text";
import type { JobOfferFilters } from "../types/job-offer-filters.types";
import type { JobOfferListParams } from "../types/job-offer-list-params.types";

export const DEFAULT_JOB_OFFER_FILTERS: JobOfferFilters = {
  search: "",
  modality: "",
  contractType: "",
  applicants: "none",
  dateFrom: "",
  dateTo: "",
  status: "",
};

// La búsqueda y el estado no se envían: se filtran en el cliente (ver selectVisibleOffers).
export function toListParams(filters: JobOfferFilters): JobOfferListParams {
  const byApplicants = filters.applicants !== "none";

  return {
    modality: filters.modality || undefined,
    contractType: filters.contractType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sortBy: byApplicants ? "applicants" : "createdAt",
    order: filters.applicants === "least" ? "asc" : "desc",
  };
}

// Se filtra en el cliente para que ambos listados ignoren mayúsculas y tildes por igual.
export function selectVisibleOffers(
  offers: JobOffer[],
  scope: JobOfferListScope,
  filters: JobOfferFilters,
): JobOffer[] {
  const normalizedSearch = normalizeSearchText(filters.search);
  const matchesSearch = (offer: JobOffer) =>
    normalizeSearchText(offer.title).includes(normalizedSearch);

  if (scope === "published") {
    return offers.filter((offer) => offer.status === PUBLISHED_STATUS && matchesSearch(offer));
  }

  return offers.filter(
    (offer) =>
      HISTORY_STATUSES.includes(offer.status) &&
      (filters.status === "" || offer.status === filters.status) &&
      matchesSearch(offer),
  );
}
