export type ValidationResult = "queued" | "auto_approved" | "manual_review" | "auto_rejected";

export type ValidationField = "fullName" | "career" | "graduationYear" | "idCardNumber" | "sisCode";

export type FieldResult = "match" | "mismatch" | "not_compared";

export interface ValidationSummary {
  result: ValidationResult;
  matchScore: number | null;
  reason: string | null;
}

export interface ValidationFieldOutcome {
  field: ValidationField;
  declared: string;
  read: string | null;
  result: FieldResult;
}

export interface ValidationDetail extends ValidationSummary {
  readAt: string | null;
  revertedAt: string | null;
  revertedBy: string | null;
  fields: ValidationFieldOutcome[];
}

export interface AutomationSummary {
  manualReviewCount: number;
  autoApprovedTodayCount: number;
  autoRejectedTodayCount: number;
  receivedTodayCount: number;
}

export type TimelineActorRole = "administrativo" | "titulado" | "sistema";

export interface TimelineItem {
  id: string;
  action: string;
  occurredAt: string;
  actorName: string;
  actorRole: TimelineActorRole;
  detail: string | null;
}

export type AutomationStateKey = "queued" | "auto_approved" | "auto_rejected" | "manual_review";

export interface AutomationState {
  key: AutomationStateKey;
  label: string;
  description: string | null;
}
