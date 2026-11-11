import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import type { CvProfileDraft } from "../types/cv-profile-draft.types";
import type { CvProfileDraftContact } from "../types/cv-profile-draft-contact.types";

const pickSelected = <T>(items: readonly T[] | null | undefined, indexes: readonly number[]): T[] =>
  (items ?? []).filter((_, index) => indexes.includes(index));

export function buildCvProfileDraft(extraction: CvExtraction, selection: CvExtractionSelection): CvProfileDraft {
  const contact = selection.contactFields.reduce<CvProfileDraftContact>((draft, field) => {
    const value = (extraction.contact[field] ?? "").trim();
    return value ? { ...draft, [field]: value } : draft;
  }, {});
  return {
    cvId: extraction.cvId,
    contact,
    educations: pickSelected(extraction.educations, selection.educations),
    workExperiences: pickSelected(extraction.workExperiences, selection.workExperiences),
  };
}
