'use client';

import { useMemo } from 'react';
import type {
  RequestStatus,
  RequestStatusResponse,
  TimelineStage,
  TimelineStageState,
} from '../types/request-status.types';

const STAGES = [
  { id: 'request-sent', label: 'Solicitud enviada' },
  { id: 'document-received', label: 'Documento recibido' },
  { id: 'career-review', label: 'Revisión de la carrera' },
  { id: 'account-activation', label: 'Activación de cuenta' },
] as const;

// Posición de la etapa actual según el estado de la solicitud.
const CURRENT_STAGE_BY_STATUS: Record<RequestStatus, number> = {
  DRAFT: 0,
  PENDING: 2,
  IN_REVIEW: 2,
  APPROVED: 3,
  REJECTED: 2,
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/La_Paz',
});

function formatDateTime(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return dateTimeFormatter.format(date);
}

function getStageState(index: number, currentIndex: number): TimelineStageState {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'pending';
}

export function useRequestTimeline(
  request: RequestStatusResponse | null,
): TimelineStage[] {
  return useMemo(() => {
    if (!request) return [];

    const occurredAtByStage = [
      request.submittedAt,
      request.documentReceivedAt,
      request.reviewStartedAt,
      request.activatedAt,
    ];
    const currentIndex = CURRENT_STAGE_BY_STATUS[request.status];

    return STAGES.map((stage, index) => ({
      id: stage.id,
      label: stage.label,
      state: getStageState(index, currentIndex),
      occurredAt: occurredAtByStage[index],
      occurredAtLabel: formatDateTime(occurredAtByStage[index]),
    }));
  }, [request]);
}
