export type RequestStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

// Contrato propuesto para el endpoint 1.1.4-B3. Ajustar cuando el backend lo defina.
export interface RequestStatusResponse {
  requestCode: string;
  status: RequestStatus;
  email: string;
  submittedAt: string | null;
  documentReceivedAt: string | null;
  reviewStartedAt: string | null;
  activatedAt: string | null;
}

export type TimelineStageState = 'completed' | 'current' | 'pending';

export interface TimelineStage {
  id: string;
  label: string;
  state: TimelineStageState;
  occurredAt: string | null;
  occurredAtLabel: string | null;
}

export interface UseRequestStatusResult {
  data: RequestStatusResponse | null;
  isLoading: boolean;
  isError: boolean;
}

export interface RequestStatusViewProps {
  requestCode: string;
}

export interface RequestStepsSidebarProps {
  currentStep: number;
}

export interface RequestTimelineProps {
  stages: TimelineStage[];
}
