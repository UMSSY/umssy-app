export interface JobOfferListParams {
  modality?: string;
  contractType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: "publishedAt" | "applicants";
  order: "asc" | "desc";
}
