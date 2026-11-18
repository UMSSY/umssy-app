import type { ReactNode } from "react";
import type { AuditEvent } from "./audit-event.types";

export interface AuditEventDetailPanelProps {
  event: AuditEvent | null;
  onClose: () => void;
  children?: ReactNode;
}
