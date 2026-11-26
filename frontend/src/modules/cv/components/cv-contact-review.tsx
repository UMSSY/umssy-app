import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFieldErrorId, getFieldErrorProps, useCities } from "@/modules/profile";
import { CV_CONTACT_FIELD_LABELS, CV_REVIEW_TEXTS } from "../constants/cv-extraction.constants";
import type { CvContactReviewProps } from "../types/cv-contact-review-props.types";
import { hasCvText } from "../utils/has-cv-text";
import { CvReviewItem } from "./cv-review-item";

export function CvContactReview({ contact, fields = [], selected = [], errors = {}, onToggle, onChange }: CvContactReviewProps) {
  const { cities } = useCities();
  const location = (contact?.location ?? "").trim();

  return (
    <ul aria-label="Datos de contacto" className="flex flex-col gap-2">
      {(fields ?? []).map((field) => {
        const fieldId = `cv-review-contact-${field}`;
        const error = errors?.[field];
        return (
          <CvReviewItem
            key={field}
            title={CV_CONTACT_FIELD_LABELS[field]}
            isChecked={selected.includes(field)}
            onToggle={() => onToggle(field)}
          >
            {field === "cityId" ? (
              <div className="flex flex-col gap-1.5">
                <Select
                  value={contact?.cityId || null}
                  items={(cities ?? []).map((city) => ({ value: city.id, label: city.title }))}
                  onValueChange={(cityId) => onChange({ cityId: cityId ?? null })}
                >
                  <SelectTrigger
                    id={fieldId}
                    aria-label={CV_CONTACT_FIELD_LABELS.cityId}
                    {...getFieldErrorProps(fieldId, error)}
                    className="w-full data-[size=default]:h-10"
                  >
                    <SelectValue placeholder={CV_REVIEW_TEXTS.cityPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {(cities ?? []).map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasCvText(location) ? (
                  <p className="text-xs text-text-secondary">{`${CV_REVIEW_TEXTS.locationHint} ${location}`}</p>
                ) : null}
              </div>
            ) : (
              <Input
                id={fieldId}
                aria-label={CV_CONTACT_FIELD_LABELS[field]}
                {...getFieldErrorProps(fieldId, error)}
                value={contact?.[field] ?? ""}
                onChange={(event) => onChange({ [field]: event.target.value })}
                className="h-10"
              />
            )}
            {error ? (
              <p id={getFieldErrorId(fieldId)} className="text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CvReviewItem>
        );
      })}
    </ul>
  );
}
