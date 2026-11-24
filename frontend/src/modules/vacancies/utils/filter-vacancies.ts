import { normalizeSearchText } from "@/shared/utils/normalize-search-text";
import type { Vacancy } from "../types/vacancy.types";

function toSearchableText(vacancy: Vacancy): string {
  return normalizeSearchText(
    [
      vacancy.title,
      vacancy.companyName,
      vacancy.description,
      vacancy.modality,
      vacancy.contractType,
      ...vacancy.requirements,
    ].join(" "),
  );
}

export function filterVacancies(vacancies: readonly Vacancy[], search: string): Vacancy[] {
  const term = normalizeSearchText(search);
  if (!term) return [...vacancies];
  return vacancies.filter((vacancy) => toSearchableText(vacancy).includes(term));
}
