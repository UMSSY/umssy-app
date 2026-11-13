import type { ApplicationStatus, StateChangedPayload } from './state-changed.dto.js';


export enum NotificationType {
  APPLICATION_STATUS_CHANGED = 'APPLICATION_STATUS_CHANGED',
}


export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Enviada',
  IN_REVIEW: 'En revisión',
  SHORTLISTED: 'Preseleccionada',
  INTERVIEW: 'Entrevista',
  OFFERED: 'Oferta recibida',
  REJECTED: 'No seleccionada',
  WITHDRAWN: 'Retirada',
};


export const STATE_CHANGED_TEMPLATE = {
  type: NotificationType.APPLICATION_STATUS_CHANGED,

  title: (ctx: StateChangedPayload) =>
    `Tu postulación cambió a "${STATUS_LABELS[ctx.newStatus]}"`,

  body: (ctx: StateChangedPayload) =>
    `Tu postulación para ${ctx.jobTitle} en ${ctx.companyName} ahora está en estado: ${STATUS_LABELS[ctx.newStatus]}.`,

  actionLabel: 'Ver postulación',
} as const;