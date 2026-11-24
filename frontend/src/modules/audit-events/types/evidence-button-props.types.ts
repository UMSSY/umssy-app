import type { AuditEvent } from "./audit-event.types";

export interface EvidenceButtonProps {
  event: AuditEvent;
  isLoading: boolean;
  onOpen: (event: AuditEvent, trigger: HTMLElement) => void;
}
