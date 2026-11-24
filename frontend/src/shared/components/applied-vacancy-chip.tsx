import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { APPLIED_VACANCY_CHIP_LABEL } from "@/shared/constants/applied-vacancy-chip.constants";
import type { AppliedVacancyChipProps } from "@/shared/types/applied-vacancy-chip-props.types";

const APPLIED_CHIP_CLASS =
  "h-6 rounded-full border-availability-border bg-availability px-2.5 font-bold text-availability-foreground";

export function AppliedVacancyChip({ className }: AppliedVacancyChipProps) {
  return (
    <Badge className={cn(APPLIED_CHIP_CLASS, className)}>
      <CircleCheck aria-hidden="true" />
      {APPLIED_VACANCY_CHIP_LABEL}
    </Badge>
  );
}
