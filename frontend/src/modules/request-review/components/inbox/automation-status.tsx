import { Clock, Cpu, Eye } from "lucide-react";
import { cn } from "cn";
import type { AutomationStatusProps } from "../../types/automatic-validation-props.types";
import { getAutomationState } from "../../utils/get-automation-state";
import { StatusBadge } from "../common/status-badge";

const STATE_STYLES = {
  queued: { icon: Clock, className: "border-gold bg-surface text-ink" },
  auto_approved: { icon: Cpu, className: "border-ink bg-ink text-surface" },
  auto_rejected: { icon: Cpu, className: "border-brand-soft bg-brand-soft text-danger" },
  manual_review: { icon: Eye, className: "border-gold bg-surface text-ink" },
} as const;

export function AutomationStatus({ status, validation }: AutomationStatusProps) {
  const state = getAutomationState(status, validation);
  if (!state) return <StatusBadge status={status} />;

  const style = STATE_STYLES[state.key];
  const Icon = style.icon;
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold whitespace-nowrap", style.className)}>
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        {state.label}
      </span>
      {state.description ? <span className="text-xs text-text-secondary">{state.description}</span> : null}
    </div>
  );
}
