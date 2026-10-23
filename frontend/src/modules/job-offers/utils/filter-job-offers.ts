export type ApplicantsOrder = "none" | "most" | "least";

export interface JobOfferFilters {
  search: string;
  modality: string;
  contractType: string;
  applicants: ApplicantsOrder;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_JOB_OFFER_FILTERS: JobOfferFilters = {
  search: "",
  modality: "",
  contractType: "",
  applicants: "none",
  dateFrom: "",
  dateTo: "",
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