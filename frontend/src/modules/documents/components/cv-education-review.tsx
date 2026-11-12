import { Textarea } from "@/components/ui/textarea";
import {
  EDUCATION_DESCRIPTION_MAX_LENGTH,
  EDUCATION_MIN_DATE,
  EducationDegreeCombobox,
  EducationInstitutionCombobox,
  getEducationDegrees,
  resolveEducationDegree,
  resolveEducationInstitution,
  useEducationDegrees,
  useEducationInstitutions,
} from "@/modules/education";
import { FormField } from "@/modules/profile";
import { DateField } from "@/shared/components/date-field";
import { CV_REVIEW_TEXTS } from "../constants/cv-extraction.constants";
import type { CvEducationReviewProps } from "../types/cv-education-review-props.types";
import { formatCvPeriod } from "../utils/format-cv-period";
import { isCvEducationIncomplete } from "../utils/is-cv-education-incomplete";
import { CvReviewItem } from "./cv-review-item";

export function CvEducationReview({ educations = [], selected = [], onToggle, onChange }: CvEducationReviewProps) {
  const { institutions } = useEducationInstitutions();
  const degreeCatalog = useEducationDegrees();
  const catalog = degreeCatalog.data ?? [];

  const changeInstitution = (index: number, institution: string, degree: string) => {
    const resolved = resolveEducationInstitution(institution, institutions);
    const nextDegree = resolved ? resolveEducationDegree(degree, getEducationDegrees(resolved, catalog)) : undefined;
    onChange(index, { institution, degree: nextDegree ?? "" });
  };

  return (
    <ul aria-label="Formación académica" className="flex flex-col gap-2">
      {(educations ?? []).map((education, index) => {
        const prefix = `cv-review-education-${index}`;
        const institution = resolveEducationInstitution(education.institution ?? "", institutions);
        const degrees = getEducationDegrees(institution ?? "", catalog);
        const title = (education.degree ?? "").trim() || CV_REVIEW_TEXTS.untitledEducation;
        return (
          <CvReviewItem
            key={prefix}
            title={`${title} · ${formatCvPeriod(education.startDate, education.endDate)}`}
            isChecked={selected.includes(index)}
            isIncomplete={isCvEducationIncomplete(education)}
            onToggle={() => onToggle(index)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id={`${prefix}-institution`} label={CV_REVIEW_TEXTS.institutionLabel} isRequired>
                <EducationInstitutionCombobox
                  id={`${prefix}-institution`}
                  value={education.institution ?? ""}
                  institutions={institutions}
                  onChange={(value) => changeInstitution(index, value, education.degree ?? "")}
                />
              </FormField>
              <FormField id={`${prefix}-degree`} label={CV_REVIEW_TEXTS.degreeLabel} isRequired>
                <EducationDegreeCombobox
                  key={institution ?? ""}
                  id={`${prefix}-degree`}
                  value={education.degree ?? ""}
                  degrees={degrees}
                  disabled={!institution || degrees.length === 0}
                  onChange={(degree) => onChange(index, { degree })}
                />
              </FormField>
              <FormField id={`${prefix}-startDate`} label={CV_REVIEW_TEXTS.startDateLabel} isRequired>
                <DateField
                  id={`${prefix}-startDate`}
                  min={EDUCATION_MIN_DATE}
                  value={education.startDate ?? ""}
                  onValueChange={(startDate) => onChange(index, { startDate: startDate || null })}
                  className="h-10"
                />
              </FormField>
              <FormField id={`${prefix}-endDate`} label={CV_REVIEW_TEXTS.endDateLabel} isRequired>
                <DateField
                  id={`${prefix}-endDate`}
                  min={EDUCATION_MIN_DATE}
                  value={education.endDate ?? ""}
                  onValueChange={(endDate) => onChange(index, { endDate: endDate || null })}
                  className="h-10"
                />
              </FormField>
            </div>
            <FormField id={`${prefix}-description`} label={CV_REVIEW_TEXTS.descriptionLabel}>
              <Textarea
                id={`${prefix}-description`}
                rows={3}
                maxLength={EDUCATION_DESCRIPTION_MAX_LENGTH}
                value={education.description ?? ""}
                onChange={(event) => onChange(index, { description: event.target.value })}
                className="field-sizing-fixed min-h-24 resize-y text-sm"
              />
            </FormField>
          </CvReviewItem>
        );
      })}
    </ul>
  );
}
