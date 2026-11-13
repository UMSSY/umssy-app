import { Checkbox } from "@/components/ui/checkbox";
import { CV_EXTRACTION_EMPTY_MESSAGES, CV_EXTRACTION_SECTION_LABELS } from "../constants/cv-extraction.constants";
import type { CvReviewSectionProps } from "../types/cv-review-section-props.types";

export function CvReviewSection({
  section,
  selectedCount,
  availableCount,
  isFullySelected,
  onToggleSection,
  children,
}: CvReviewSectionProps) {
  const label = CV_EXTRACTION_SECTION_LABELS[section];

  if (availableCount === 0) {
    return <p className="py-6 text-center text-sm text-text-secondary">{CV_EXTRACTION_EMPTY_MESSAGES[section]}</p>;
  }

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg bg-surface-soft px-4 py-3 text-sm text-ink">
        <Checkbox
          aria-label={`Incluir sección ${label}`}
          checked={isFullySelected}
          indeterminate={selectedCount > 0 && !isFullySelected}
          onCheckedChange={onToggleSection}
        />
        <span className="font-semibold">{label}</span>
        <span className="ml-auto text-text-secondary">{`${selectedCount} de ${availableCount} seleccionados`}</span>
      </div>
      {children}
    </section>
  );
}
