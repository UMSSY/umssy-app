import { Cpu } from "lucide-react";
import { getInitials } from "@/shared/utils/get-initials";
import { AUDIT_ROLE_LABELS } from "../../constants/audit-actions.constants";
import { EMPTY_VALUE } from "../../constants/audit-log.constants";
import type { AuditResponsibleCellProps } from "../../types/audit-log-component-props.types";

// Muestra a quien ejecutó el hecho según el evento, no al administrativo que consulta
export function AuditResponsibleCell({ responsible }: AuditResponsibleCellProps) {
  const name = responsible.name.trim() || EMPTY_VALUE;
  const isSystem = responsible.role === "sistema";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-soft text-xs font-bold text-ink"
        aria-hidden="true"
      >
        {isSystem ? <Cpu className="size-4 text-text-secondary" strokeWidth={1.75} /> : getInitials(name)}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold break-words text-ink">{name}</span>
        <span className="text-[12.5px] text-text-secondary">{AUDIT_ROLE_LABELS[responsible.role] ?? EMPTY_VALUE}</span>
      </div>
    </div>
  );
}
