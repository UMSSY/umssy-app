import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CV_REVIEW_TEXTS } from "../constants/cv-extraction.constants";
import type { CvReviewItemProps } from "../types/cv-review-item-props.types";

export function CvReviewItem({ title, isChecked, isIncomplete = false, onToggle, children }: CvReviewItemProps) {
  return (
    <li className="flex flex-col gap-4 rounded-lg border border-border px-4 py-3 text-sm text-ink">
      <div className="flex items-start gap-3">
        <Checkbox aria-label={`Incluir ${title}`} checked={isChecked} onCheckedChange={onToggle} className="mt-0.5" />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-semibold [overflow-wrap:anywhere]">
          {title}
          {isIncomplete ? <Badge variant="outline">{CV_REVIEW_TEXTS.incomplete}</Badge> : null}
        </span>
      </div>
      {children}
    </li>
  );
}
