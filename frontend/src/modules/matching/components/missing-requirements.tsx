import { Check, Circle } from "lucide-react";
import { JOB_MATCHING_MESSAGES } from "../constants/job-matching.constants";
import {
  REQUIREMENT_GROUP_LABELS,
  REQUIREMENT_STATUS_LABELS,
} from "../constants/requirement-display.constants";
import type { CategorizedJobRequirement } from "../types/requirement-category.types";
import { groupRequirements } from "../utils/group-requirements";

interface MissingRequirementsProps {
  requirements: CategorizedJobRequirement[];
  title?: string;
}

export function MissingRequirements({
  requirements,
  title = JOB_MATCHING_MESSAGES.requirementsTitle,
}: MissingRequirementsProps) {
  const hasPending = requirements.some(({ status }) => status === "Pendiente");
  const groups = groupRequirements(requirements);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {!hasPending && (
        <p role="status" className="text-sm text-ink-soft">
          {JOB_MATCHING_MESSAGES.noPendingRequirements}
        </p>
      )}
      {groups.map(({ category, requirements: items }) => (
        <div key={category ?? "all"} className="flex flex-col gap-1">
          {category && (
            <h4 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              {REQUIREMENT_GROUP_LABELS[category]}
            </h4>
          )}
          <ul className="flex flex-col">
            {items.map(({ name, status }) => (
              <li
                key={`${category ?? "all"}-${name}`}
                className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
              >
                <span className="text-ink">{name}</span>
                {status === "Cumple" ? (
                  <span className="flex items-center gap-1.5 font-semibold text-ink">
                    <Check className="size-4" aria-hidden="true" />
                    {REQUIREMENT_STATUS_LABELS[status]}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <Circle className="size-4" aria-hidden="true" />
                    {REQUIREMENT_STATUS_LABELS[status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
