import { Check, ClipboardList, Eye, KeyRound, RefreshCw, ScanText, Send, Undo2, UserCheck, X, type LucideIcon } from "lucide-react";
import type { AuditAction, AuditActorRole } from "../types/audit-event.types";

export const AUDIT_ACTION_STYLES: Record<AuditAction, { label: string; icon: LucideIcon; className: string }> = {
  submitted: { label: "Solicitud enviada", icon: Send, className: "border-border-strong bg-surface text-ink" },
  opened: { label: "Abierta para revisión", icon: Eye, className: "border-accent bg-interaction text-accent" },
  approved: { label: "Aprobada", icon: Check, className: "border-accent bg-accent text-surface" },
  rejected: { label: "Rechazada", icon: X, className: "border-brand-red bg-brand-soft text-danger" },
  activation_code_sent: { label: "Código de activación enviado", icon: KeyRound, className: "border-border-strong bg-surface text-ink" },
  account_activated: { label: "Cuenta activada", icon: UserCheck, className: "border-border-strong bg-surface text-ink" },
  document_replaced: { label: "Documento reemplazado", icon: RefreshCw, className: "border-gold bg-surface text-ink" },
  ocr_read: { label: "Lectura OCR", icon: ScanText, className: "border-border-strong bg-surface text-ink" },
  sent_to_manual_review: { label: "Enviada a revisión manual", icon: ClipboardList, className: "border-gold bg-surface text-ink" },
  approval_reverted: { label: "Aprobación revertida", icon: Undo2, className: "border-accent bg-interaction text-accent" },
};

export const AUDIT_ROLE_LABELS: Record<AuditActorRole, string> = {
  administrativo: "Administrativo",
  titulado: "Titulado",
  sistema: "Proceso automático",
};
