import { ArrowDown, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EDUCATION_FEEDBACK_MESSAGES } from "../constants/education-feedback.constants";
import { EDUCATION_UI_TEXTS } from "../constants/education-ui.constants";
import type { EducationListCardProps } from "../types/education-list-card-props.types";
import { formatEducationPeriod } from "../utils/format-education-period";
import { FeedbackMessage } from "@/modules/profile";
import { SectionCard } from "@/modules/profile";

export function EducationListCard({
  educations = [],
  isLoading = false,
  error = null,
  isBusy = false,
  onAdd,
  onEdit,
  onDelete,
}: EducationListCardProps) {
  return (
    <SectionCard
      title="Formación académica"
      action={onAdd ? <Button variant="outline" size="sm" onClick={onAdd} disabled={isBusy}><Plus aria-hidden="true" />Añadir formación</Button> : null}
    >
      {isLoading ? (
        <p role="status" className="text-sm text-text-secondary">
          {EDUCATION_FEEDBACK_MESSAGES.loading}
        </p>
      ) : error ? (
        <FeedbackMessage feedback={{ type: "error", message: error }} />
      ) : (educations ?? []).length === 0 ? (
        <p role="status" className="text-sm text-text-secondary">
          {EDUCATION_FEEDBACK_MESSAGES.empty}
        </p>
      ) : (
        <ul aria-label={EDUCATION_UI_TEXTS.listTitle} className="relative divide-y divide-border">
          {(educations ?? []).map((education) => (
            <li key={education.id} className="group/timeline relative flex items-start justify-between gap-4 py-5 first:pt-0">
              <span aria-hidden="true" className="absolute top-12 -bottom-5 left-6 border-l border-border-strong group-last/timeline:hidden" />
              <ArrowDown aria-hidden="true" className="absolute bottom-1 left-4 hidden size-4 text-accent group-last/timeline:block" />
              <div aria-hidden="true" className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-interaction text-accent"><GraduationCap className="size-6" strokeWidth={1.5} /></div>
              <div className="min-w-0 flex-1 break-words">
                <h3 className="text-base font-bold text-ink">{education.degree}</h3>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {education.institution} · {formatEducationPeriod(education.startDate, education.endDate)}
                </p>
                {education.description ? (
                  <p className="mt-2 text-sm whitespace-pre-line text-text-secondary">
                    {education.description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`${EDUCATION_UI_TEXTS.editButton} ${education.degree}`}
                  disabled={isBusy}
                  onClick={() => onEdit?.(education)}
                  className="size-9 p-0 text-ink-soft"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`${EDUCATION_UI_TEXTS.deleteButton} ${education.degree}`}
                  disabled={isBusy}
                  onClick={() => onDelete?.(education)}
                  className="size-9 p-0 text-danger hover:bg-brand-red/10 hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </SectionCard>
  );
}
