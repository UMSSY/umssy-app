import type { ApplicationStatus } from "./application.types";

export type ApplicationSortKey = "vacancy" | "company" | "affinity" | "status";

export type SortDirection = "asc" | "desc";

export interface ApplicationSort {
  key: ApplicationSortKey;
  direction: SortDirection;
}

export type ApplicationStatusFilter = "all" | ApplicationStatus;
