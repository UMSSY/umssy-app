import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionResponse } from "../types/cv-extraction-response.types";

export function toCvExtraction(response: CvExtractionResponse): CvExtraction {
  const contact = response.contact ?? {};
  return {
    cvId: response.cvId,
    contact: {
      firstName: contact.firstName ?? null,
      lastName: contact.lastName ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      location: contact.location ?? null,
    },
    educations: response.educations ?? [],
    workExperiences: response.workExperiences ?? [],
  };
}
