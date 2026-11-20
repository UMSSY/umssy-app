import type { AuditEvent } from "./audit-event.types";

export interface AuditEventListProps {
  items: AuditEvent[];
  isLoading?: boolean;
  loadingEvidenceId: string | null;
  onOpenEvidence: (event: AuditEvent, trigger: HTMLElement) => void;
}
