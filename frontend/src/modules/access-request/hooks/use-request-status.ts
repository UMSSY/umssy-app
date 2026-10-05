'use client';

import type {
  RequestStatusResponse,
  UseRequestStatusResult,
} from '../types/request-status.types';

// Datos de ejemplo mientras no exista el endpoint 1.1.4-B3.
// Cuando esté listo, reemplazar el cuerpo de este hook por una llamada al
// servicio del módulo con useQuery (TanStack Query) usando el código de solicitud.
const MOCK_REQUEST_STATUS: RequestStatusResponse = {
  requestCode: 'SOL-2026-0148',
  status: 'IN_REVIEW',
  email: 'titulado@umss.edu',
  submittedAt: '2026-10-03T14:35:00-04:00',
  documentReceivedAt: '2026-10-03T14:35:00-04:00',
  reviewStartedAt: '2026-10-03T15:10:00-04:00',
  activatedAt: null,
};

export function useRequestStatus(requestCode: string): UseRequestStatusResult {
  return {
    data: { ...MOCK_REQUEST_STATUS, requestCode },
    isLoading: false,
    isError: false,
  };
}
