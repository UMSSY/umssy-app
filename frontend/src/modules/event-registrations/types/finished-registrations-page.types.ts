import type { Registration } from "./registration.types";

export interface FinishedRegistrationsPage {
  items: Registration[];
  total: number;
  totalPages: number;
  limit: number;
}
