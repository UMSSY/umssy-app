import type { RefObject } from "react";
import type { AuditAction, AuditEvent, AuditResponsible } from "./audit-event.types";

export interface AuditActionBadgeProps {
  action: AuditAction;
}

export interface AuditEventDateProps {
  occurredAt: string;
  inline?: boolean;
}

export interface AuditResponsibleCellProps {
  responsible: AuditResponsible;
}

export interface EvidenceButtonProps {
  event: AuditEvent;
  isLoading: boolean;
  onOpen: (event: AuditEvent, trigger: HTMLElement) => void;
}

export interface AuditEventListProps {
  items: AuditEvent[];
  isLoading?: boolean;
  loadingEvidenceId: string | null;
  onOpenEvidence: (event: AuditEvent, trigger: HTMLElement) => void;
}

export interface AuditPaginationProps {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
}

export interface AuditLogStatusProps {
  error: string | null;
  errorStatus: number | null;
  isEmpty: boolean;
  hasActiveFilters?: boolean;
  onRetry: () => void;
  onClearFilters?: () => void;
}

export interface OpenEvidence {
  event: AuditEvent;
  url: string;
}

export interface EvidenceViewerDialogProps {
  event: AuditEvent | null;
  url: string | null;
  finalFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
}
