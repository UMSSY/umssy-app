import { Check, Minus } from "lucide-react";
import { JOB_MATCHING_MESSAGES } from "../constants/job-matching.constants";
import type { JobRequirement } from "../types/job-matching.types";

interface MissingRequirementsProps {
  requirements: JobRequirement[];
  title?: string;
}

export function MissingRequirements({
  requirements,
  title = JOB_MATCHING_MESSAGES.requirementsTitle,
}: MissingRequirementsProps) {
  const hasMissing = requirements.some(({ status }) => status === "missing");

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-tight text-lg font-bold text-ink">{title}</h3>
      {!hasMissing && (
        <p role="status" className="text-sm text-ink-soft">
          {JOB_MATCHING_MESSAGES.noPendingRequirements}
        </p>
      )}
      {requirements.length > 0 && (
        <ul className="flex flex-col">
          {requirements.map(({ name, status }) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
            >
              <span className="text-ink">{name}</span>
              {status === "matched" ? (
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  <Check className="size-4" aria-hidden="true" />
                  {JOB_MATCHING_MESSAGES.requirementMatched}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Minus className="size-4" aria-hidden="true" />
                  {JOB_MATCHING_MESSAGES.requirementMissing}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
