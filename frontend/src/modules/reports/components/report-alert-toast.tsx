import { TriangleAlert, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportAlertVariant = "warning" | "error";

interface ReportAlertToastProps {
  variant: ReportAlertVariant;
  message?: string;
}

const VARIANT_STYLES: Record<ReportAlertVariant, { container: string; icon: string }> = {
  warning: { container: "border-amber-500 bg-amber-50", icon: "text-amber-600" },
  error: { container: "border-red-500 bg-red-50", icon: "text-red-600" },
};

// Aviso flotante en la parte superior de la vista para problemas de carga del reporte.
export function ReportAlertToast({ variant, message }: ReportAlertToastProps) {
  if (!message) {
    return null;
  }

  const styles = VARIANT_STYLES[variant];
  const Icon = variant === "error" ? WifiOff : TriangleAlert;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <p
        role={variant === "error" ? "alert" : "status"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={cn(
          "flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium text-ink shadow-md animate-in fade-in slide-in-from-top-2",
          styles.container,
        )}
      >
        <Icon className={cn("size-5 shrink-0", styles.icon)} strokeWidth={2} aria-hidden="true" />
        {message}
      </p>
    </div>
  );
}