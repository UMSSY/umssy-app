import type { EducationDegreeCatalogEntry } from "../types/education-degree-catalog-entry.types";
import type { EducationDegree } from '../types/education-degree.types';
import { normalizeEducationText } from './normalize-education-text';

export function getEducationDegrees(
  institution: string,
  catalog: readonly EducationDegreeCatalogEntry[] = [],
): readonly EducationDegree[] {
  const name = normalizeEducationText(institution);
  return (
    catalog.find((entry) => normalizeEducationText(entry.institution) === name)
      ?.degrees ?? []
  );
}

export function resolveEducationDegree(value: string, degrees: readonly EducationDegree[]): string | undefined {
  const normalized = normalizeEducationText(value ?? '');
  return degrees.find((degree) => [degree.name, ...degree.aliases]
    .some((name) => normalizeEducationText(name) === normalized))?.name;
}
