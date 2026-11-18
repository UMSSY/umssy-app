import type { FinishedRegistrationItem } from "./finished-registration-item.types";

export interface FinishedHistoryPage {
  items: FinishedRegistrationItem[];
  total: number;
  totalPages: number;
  limit: number;
}
