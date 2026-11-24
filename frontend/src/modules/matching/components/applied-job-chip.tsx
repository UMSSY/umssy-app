"use client";

import { AppliedVacancyChip } from "@/shared/components/applied-vacancy-chip";
import { useAppliedJobOfferIds } from "../hooks/use-applied-job-offer-ids";
import type { AppliedJobChipProps } from "../types/applied-job-chip-props.types";

export function AppliedJobChip({ jobOfferId, className }: AppliedJobChipProps) {
  const appliedIds = useAppliedJobOfferIds();

  return appliedIds.has(jobOfferId) ? <AppliedVacancyChip className={className} /> : null;
}
