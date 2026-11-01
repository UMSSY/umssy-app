import { ShieldCheck } from "lucide-react";
import { BOLIVIA_TIME_LABEL } from "../../constants/audit-log.constants";

export function AuditReadOnlyNotice() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-lg border border-notice-border bg-notice px-4 py-3 text-notice-foreground">
      <ShieldCheck className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold">Registro de solo lectura</p>
        <p className="text-[13px]">
          Los eventos se guardan automáticamente y no pueden editarse ni borrarse. Las horas están en {BOLIVIA_TIME_LABEL}.
        </p>
      </div>
    </div>
  );
}
