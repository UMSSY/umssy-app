import type { RefObject } from "react";
import type { AuditEvent } from "./audit-event.types";

export interface EvidenceViewerDialogProps {
  event: AuditEvent | null;
  url: string | null;
  finalFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
}
