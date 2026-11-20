import type { ApplicantsOrder } from "./applicants-order.types";

export interface JobOfferFilters {
  search: string;
  modality: string;
  contractType: string;
  applicants: ApplicantsOrder;
  dateFrom: string;
  dateTo: string;
  status: string;
}
