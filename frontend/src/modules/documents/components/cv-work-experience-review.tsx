import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/modules/profile";
import {
  WORK_EXPERIENCE_COMPANY_NAME_MAX_LENGTH,
  WORK_EXPERIENCE_DESCRIPTION_MAX_LENGTH,
  WORK_EXPERIENCE_MIN_DATE,
  WORK_EXPERIENCE_POSITION_MAX_LENGTH,
} from "@/modules/work-experience";
import { DateField } from "@/shared/components/date-field";
import { CV_REVIEW_TEXTS, CV_WORK_EXPERIENCE_CURRENT_LABEL } from "../constants/cv-extraction.constants";
import type { CvWorkExperienceReviewProps } from "../types/cv-work-experience-review-props.types";
import { formatCvPeriod } from "../utils/format-cv-period";
import { isCvWorkExperienceIncomplete } from "../utils/is-cv-work-experience-incomplete";
import { CvReviewItem } from "./cv-review-item";

export function CvWorkExperienceReview({
  workExperiences = [],
  selected = [],
  onToggle,
  onChange,
}: CvWorkExperienceReviewProps) {
  return (
    <ul aria-label="Experiencia laboral" className="flex flex-col gap-2">
      {(workExperiences ?? []).map((experience, index) => {
        const prefix = `cv-review-experience-${index}`;
        const title = (experience.position ?? "").trim() || CV_REVIEW_TEXTS.untitledExperience;
        return (
          <CvReviewItem
            key={prefix}
            title={`${title} · ${formatCvPeriod(experience.startDate, experience.endDate, experience.isCurrent)}`}
            isChecked={selected.includes(index)}
            isIncomplete={isCvWorkExperienceIncomplete(experience)}
            onToggle={() => onToggle(index)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id={`${prefix}-position`} label={CV_REVIEW_TEXTS.positionLabel} isRequired>
                <Input
                  id={`${prefix}-position`}
                  maxLength={WORK_EXPERIENCE_POSITION_MAX_LENGTH}
                  value={experience.position ?? ""}
                  onChange={(event) => onChange(index, { position: event.target.value })}
                  className="h-10"
                />
              </FormField>
              <FormField id={`${prefix}-company`} label={CV_REVIEW_TEXTS.companyLabel} isRequired>
                <Input
                  id={`${prefix}-company`}
                  maxLength={WORK_EXPERIENCE_COMPANY_NAME_MAX_LENGTH}
                  value={experience.companyName ?? ""}
                  onChange={(event) => onChange(index, { companyName: event.target.value })}
                  className="h-10"
                />
              </FormField>
              <FormField id={`${prefix}-startDate`} label={CV_REVIEW_TEXTS.startDateLabel} isRequired>
                <DateField
                  id={`${prefix}-startDate`}
                  min={WORK_EXPERIENCE_MIN_DATE}
                  value={experience.startDate ?? ""}
                  onValueChange={(startDate) => onChange(index, { startDate: startDate || null })}
                  className="h-10"
                />
              </FormField>
              <FormField id={`${prefix}-endDate`} label={CV_REVIEW_TEXTS.endDateLabel} isRequired={!experience.isCurrent}>
                <DateField
                  id={`${prefix}-endDate`}
                  min={WORK_EXPERIENCE_MIN_DATE}
                  value={experience.endDate ?? ""}
                  disabled={experience.isCurrent}
                  onValueChange={(endDate) => onChange(index, { endDate: endDate || null })}
                  className="h-10"
                />
              </FormField>
            </div>
            <Label htmlFor={`${prefix}-isCurrent`} className="flex items-center gap-3 text-sm font-normal text-ink">
              <Checkbox
                id={`${prefix}-isCurrent`}
                checked={experience.isCurrent}
                onCheckedChange={(isCurrent) => onChange(index, isCurrent ? { isCurrent, endDate: null } : { isCurrent })}
              />
              {CV_WORK_EXPERIENCE_CURRENT_LABEL}
            </Label>
            <FormField id={`${prefix}-description`} label={CV_REVIEW_TEXTS.descriptionLabel} isRequired>
              <Textarea
                id={`${prefix}-description`}
                rows={4}
                maxLength={WORK_EXPERIENCE_DESCRIPTION_MAX_LENGTH}
                value={experience.description ?? ""}
                onChange={(event) => onChange(index, { description: event.target.value })}
                className="field-sizing-fixed min-h-28 resize-y text-sm"
              />
            </FormField>
          </CvReviewItem>
        );
      })}
    </ul>
  );
}
