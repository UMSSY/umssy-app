import { ClipboardCheck } from "lucide-react";

export function SurveyNotificationsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ClipboardCheck className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-2 text-base font-semibold text-foreground">{"No hay encuestas disponibles"}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{"Cuando tengas una nueva encuesta asignada, aparecerá aquí."}</p>
    </div>
  );
}
