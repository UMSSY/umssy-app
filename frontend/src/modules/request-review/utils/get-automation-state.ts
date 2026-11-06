import { AUTOMATION_LABELS, QUEUED_DESCRIPTION } from "../constants/automatic-validation.constants";
import type { AutomationState, ValidationSummary } from "../types/automatic-validation.types";
import type { ReviewStatus } from "../types/request-review.types";

export function getAutomationState(status: ReviewStatus, validation?: ValidationSummary | null): AutomationState | null {
  if (!validation) return null;
  const open = status === "pending" || status === "in_review";
  if (validation.result === "queued" && status === "pending") {
    return { key: "queued", label: AUTOMATION_LABELS.queued, description: QUEUED_DESCRIPTION };
  }
  if (validation.result === "auto_approved" && status === "approved") {
    return { key: "auto_approved", label: AUTOMATION_LABELS.auto_approved, description: null };
  }
  if (validation.result === "auto_rejected" && status === "rejected") {
    return { key: "auto_rejected", label: AUTOMATION_LABELS.auto_rejected, description: validation.reason };
  }
  if (validation.result === "manual_review" && open) {
    return { key: "manual_review", label: AUTOMATION_LABELS.manual_review, description: validation.reason };
  }
  return null;
}
