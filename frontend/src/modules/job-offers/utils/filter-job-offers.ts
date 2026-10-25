import { HISTORY_STATUSES, PUBLISHED_STATUS } from "../constants/vacancies.constants";
import type { JobOffer, JobOfferListScope } from "../types/job-offer.types";
import { normalizeSearchText } from "./normalize-search-text";

export type ApplicantsOrder = "none" | "most" | "least";

export interface JobOfferFilters {
  search: string;
  modality: string;
  contractType: string;
  applicants: ApplicantsOrder;
  dateFrom: string;
  dateTo: string;
  status: string;
}

export const DEFAULT_JOB_OFFER_FILTERS: JobOfferFilters = {
  search: "",
  modality: "",
  contractType: "",
  applicants: "none",
  dateFrom: "",
  dateTo: "",
  status: "",
};

export interface JobOfferListParams {
  search?: string;
  modality?: string;
  contractType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: "createdAt" | "applicants";
  order: "asc" | "desc";
}

export function toListParams(filters: JobOfferFilters): JobOfferListParams {
  const byApplicants = filters.applicants !== "none";

  return {
    search: filters.search.trim() || undefined,
    modality: filters.modality || undefined,
    contractType: filters.contractType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sortBy: byApplicants ? "applicants" : "createdAt",
    order: filters.applicants === "least" ? "asc" : "desc",
  };
}

export function selectVisibleOffers(
  offers: JobOffer[],
  scope: JobOfferListScope,
  filters: JobOfferFilters,
): JobOffer[] {
  if (scope === "published") {
    return offers.filter((offer) => offer.status === PUBLISHED_STATUS);
  }

  const normalizedSearch = normalizeSearchText(filters.search);

  return offers.filter(
    (offer) =>
      HISTORY_STATUSES.includes(offer.status) &&
      (filters.status === "" || offer.status === filters.status) &&
      normalizeSearchText(offer.title).includes(normalizedSearch),
  );
}