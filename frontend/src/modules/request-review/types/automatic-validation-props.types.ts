import type { InboxSummary } from "./inbox-summary.types";
import type { ReviewDetail, ReviewStatus } from "./request-review.types";
import type { AutomationSummary, ValidationSummary } from "./automatic-validation.types";

export interface AutomationStatusProps {
  status: ReviewStatus;
  validation?: ValidationSummary | null;
}

export interface MatchScoreBarProps {
  validation?: ValidationSummary | null;
}

export interface AutomationSummaryCardsProps {
  automation: AutomationSummary | null;
  inbox: InboxSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export interface AutomaticValidationPanelProps {
  detail: ReviewDetail;
}

export interface RevertApprovalPanelProps {
  detail: ReviewDetail;
}

export interface RequestTimelineProps {
  detail: ReviewDetail;
}
