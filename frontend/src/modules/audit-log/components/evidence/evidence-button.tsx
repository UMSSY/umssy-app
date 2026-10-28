"use client";

import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NO_EVIDENCE_LABEL } from "../../constants/audit-log.constants";
import type { EvidenceButtonProps } from "../../types/audit-log-component-props.types";

export function EvidenceButton({ event, isLoading, onOpen }: EvidenceButtonProps) {
  if (!event.evidence) {
    return <span className="text-[13px] text-text-secondary">{NO_EVIDENCE_LABEL}</span>;
  }

  return (
    <Button
      type="button"
      variant="link"
      disabled={isLoading}
      aria-label={`Ver documento del evento ${event.code}`}
      onClick={(clickEvent) => onOpen(event, clickEvent.currentTarget)}
      className="h-auto gap-1.5 px-0 text-[13.5px] font-semibold text-ink"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <FileText className="size-4" strokeWidth={1.75} aria-hidden="true" />
      )}
      {isLoading ? "Abriendo…" : "Ver documento"}
    </Button>
  );
}
