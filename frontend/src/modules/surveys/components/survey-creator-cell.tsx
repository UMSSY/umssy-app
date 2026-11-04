import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SurveyCreatorCellProps } from "../types/survey-history-component-props.types";
import { getInitials } from "../utils/get-initials";

export function SurveyCreatorCell({ fullName, email }: SurveyCreatorCellProps) {
  return (
    <span className="flex items-center gap-3">
      <Avatar size="lg" className="after:border-transparent">
        <AvatarFallback className="bg-ink-soft text-sm font-semibold text-surface">{getInitials(fullName)}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="font-medium text-ink">{fullName}</span>
        <span className="truncate text-xs text-text-secondary">{email}</span>
      </span>
    </span>
  );
}
