"use client";

import { useEducationDegrees, useEducationInstitutions } from "@/modules/educations";
import type { CvEducationNamesResolver } from "../types/cv-education-names-resolver.types";
import { createCvEducationNamesResolver } from "../utils/create-cv-education-names-resolver";

export function useCvEducationNamesResolver(): CvEducationNamesResolver {
  const { institutions } = useEducationInstitutions();
  const degreeCatalog = useEducationDegrees();
  return createCvEducationNamesResolver(institutions, degreeCatalog.data);
}
