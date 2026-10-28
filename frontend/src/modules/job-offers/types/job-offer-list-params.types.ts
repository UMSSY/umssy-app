export interface JobOfferListParams {
  modality?: string;
  contractType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: "createdAt" | "applicants";
  order: "asc" | "desc";
}
