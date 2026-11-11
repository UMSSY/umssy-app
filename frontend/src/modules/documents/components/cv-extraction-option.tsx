import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CvExtractionOptionProps } from "../types/cv-extraction-option-props.types";

export function CvExtractionOption({
  title,
  details = [],
  isChecked,
  isIncomplete = false,
  onToggle,
}: CvExtractionOptionProps) {
  return (
    <li>
      <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-4 py-3 text-sm font-normal text-ink hover:bg-surface-soft">
        <Checkbox checked={isChecked} onCheckedChange={onToggle} className="mt-0.5" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold [overflow-wrap:anywhere]">
            {title}
            {isIncomplete ? <Badge variant="outline">Incompleto</Badge> : null}
          </span>
          {(details ?? []).map((detail) => (
            <span key={detail} className="[overflow-wrap:anywhere] text-text-secondary">
              {detail}
            </span>
          ))}
        </span>
      </Label>
    </li>
  );
}
