import type { Application } from "../types/application.types";
import type { ApplicationStatusFilter } from "../types/application-status-filter.types";

export function filterApplicationsByStatus(
  applications: readonly Application[],
  filter: ApplicationStatusFilter,
): Application[] {
  if (filter === "all") return [...applications];
  return applications.filter((application) => application.status === filter);
}
