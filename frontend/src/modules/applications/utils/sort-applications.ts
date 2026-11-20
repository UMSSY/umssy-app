import type { Application } from "../types/application.types";
import type { ApplicationSort } from "../types/application-sort.types";
import type { ApplicationSortKey } from "../types/application-sort-key.types";

const STATUS_ORDER = [
  "En revisión",
  "Entrevista",
  "Aceptada",
  "No seleccionado",
  "Retirada",
];

const SORT_VALUE: Record<ApplicationSortKey, (application: Application) => string | number> = {
  vacancy: (application) => application.vacancyTitle,
  company: (application) => application.companyName,
  affinity: (application) => application.affinityPercentage,
  status: (application) => STATUS_ORDER.indexOf(application.status),
  date: (application) => Date.parse(application.appliedDate),
};

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "es", { sensitivity: "base" });
}

export function sortApplications(
  applications: readonly Application[],
  sort: ApplicationSort | null,
): Application[] {
  const selected = sort ?? { key: "date", direction: "desc" };
  const read = SORT_VALUE[selected.key];
  const factor = selected.direction === "asc" ? 1 : -1;

  return [...applications].sort((left, right) => {
    const primary = factor * compareValues(read(left), read(right));
    if (primary !== 0) return primary;

    const dateDifference =
      Date.parse(right.appliedDate) - Date.parse(left.appliedDate);
    if (dateDifference !== 0) return dateDifference;

    const titleDifference = compareValues(left.vacancyTitle, right.vacancyTitle);
    return titleDifference || left.id.localeCompare(right.id);
  });
}

export function nextApplicationSort(
  current: ApplicationSort | null,
  key: ApplicationSortKey,
): ApplicationSort {
  if (current?.key === key && current.direction === "asc") return { key, direction: "desc" };
  return { key, direction: "asc" };
}
