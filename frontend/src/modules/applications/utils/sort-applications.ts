import type { Application } from "../types/application.types";
import type { ApplicationSort, ApplicationSortKey } from "../types/application-list.types";

const SORT_VALUE: Record<ApplicationSortKey, (application: Application) => string | number> = {
  vacancy: (application) => application.vacancyTitle,
  company: (application) => application.companyName,
  affinity: (application) => application.affinityPercentage,
  status: (application) => application.status,
};

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "es", { sensitivity: "base" });
}

export function sortApplications(
  applications: readonly Application[],
  sort: ApplicationSort | null,
): Application[] {
  if (!sort) return [...applications];
  const read = SORT_VALUE[sort.key];
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...applications].sort((left, right) => factor * compareValues(read(left), read(right)));
}

export function nextApplicationSort(
  current: ApplicationSort | null,
  key: ApplicationSortKey,
): ApplicationSort {
  if (current?.key === key && current.direction === "asc") return { key, direction: "desc" };
  return { key, direction: "asc" };
}
