import { getEducationDegrees, resolveEducationDegree, resolveEducationInstitution } from "@/modules/educations";
import type { CvEducationNamesResolver } from "../types/cv-education-names-resolver.types";

export function createCvEducationNamesResolver(
  institutions: Parameters<typeof resolveEducationInstitution>[1] | null | undefined,
  degreeCatalog: Parameters<typeof getEducationDegrees>[1] | null | undefined,
): CvEducationNamesResolver {
  return ({ institution, degree }) => {
    const resolvedInstitution = resolveEducationInstitution(institution, institutions ?? []) ?? institution;
    const degrees = getEducationDegrees(resolvedInstitution, degreeCatalog ?? []);
    return { institution: resolvedInstitution, degree: resolveEducationDegree(degree, degrees) ?? degree };
  };
}
