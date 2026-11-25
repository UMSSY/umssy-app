export const COMPANY_STATUS_TABS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "REJECTED", label: "Rechazadas" },
] as const;

export const COMPANY_INBOX_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  OBSERVED: "Observada",
};

export const COMPANY_DETAIL_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    bgClass: string;
    textClass: string;
  }
> = {
  PENDING: {
    label: "Pendiente",
    variant: "secondary",
    bgClass:
      "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    textClass: "text-slate-600",
  },
  IN_REVIEW: {
    label: "En revisión",
    variant: "outline",
    bgClass:
      "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
    textClass: "text-blue-600",
  },
  OBSERVED: {
    label: "Subsanación solicitada",
    variant: "secondary",
    bgClass:
      "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    textClass: "text-rose-600",
  },
  APPROVED: {
    label: "Aprobada",
    variant: "default",
    bgClass:
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    textClass: "text-emerald-600",
  },
  REJECTED: {
    label: "Rechazada",
    variant: "destructive",
    bgClass:
      "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400",
    textClass: "text-rose-600",
  },
};

export const COMPANY_CORRECTION_REASONS = [
  "Carta membretada sin firma o sello institucional",
  "Discrepancia entre la razón social declarada y el documento",
  "Falta información de contacto corporativo verificable",
  "Documento ilegible, incompleto o de baja resolución",
  "Otro motivo de observación",
] as const;

export const COMPANY_REJECTION_REASONS = [
  "Empresa no verificable o inexistente",
  "Documentación no auténtica o con inconsistencias graves",
  "Actividad o rubro incompatible con las políticas universitarias",
  "Reincidencia en envío de datos apócrifos",
  "Otro motivo de rechazo",
] as const;
