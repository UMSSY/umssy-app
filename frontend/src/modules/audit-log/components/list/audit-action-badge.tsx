import { CircleHelp } from "lucide-react";
import { cn } from "cn";
import { AUDIT_ACTION_STYLES } from "../../constants/audit-actions.constants";
import type { AuditActionBadgeProps } from "../../types/audit-log-component-props.types";

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const style = AUDIT_ACTION_STYLES[action];
  const Icon = style?.icon ?? CircleHelp;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold whitespace-nowrap",
        style?.className ?? "border-border bg-surface text-ink",
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      {style?.label ?? action}
    </span>
  );
}
