import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  RequestStatus,
  RequestStatusResponse,
} from '../types/request-status.types';
import { STATUS_LABELS, useRequestTimeline } from './use-request-timeline';

function buildRequest(
  status: RequestStatus,
  overrides: Partial<RequestStatusResponse> = {},
): RequestStatusResponse {
  return {
    requestCode: 'SOL-2026-0001',
    status,
    email: 'titulado@umss.edu',
    submittedAt: '2026-10-03T14:35:00-04:00',
    documentReceivedAt: '2026-10-03T14:35:00-04:00',
    reviewStartedAt: null,
    activatedAt: null,
    ...overrides,
  };
}

const EXPECTED_STATES: Array<[RequestStatus, string[]]> = [
  ['DRAFT', ['current', 'pending', 'pending', 'pending']],
  ['PENDING', ['completed', 'completed', 'current', 'pending']],
  ['IN_REVIEW', ['completed', 'completed', 'current', 'pending']],
  ['APPROVED', ['completed', 'completed', 'completed', 'current']],
  ['REJECTED', ['completed', 'completed', 'current', 'pending']],
];

describe('useRequestTimeline', () => {
  it('devuelve una lista vacía cuando no hay solicitud', () => {
    const { result } = renderHook(() => useRequestTimeline(null));

    expect(result.current).toEqual([]);
  });

  it('devuelve las cuatro etapas en orden', () => {
    const request = buildRequest('IN_REVIEW');
    const { result } = renderHook(() => useRequestTimeline(request));

    expect(result.current.map((stage) => stage.label)).toEqual([
      'Solicitud enviada',
      'Documento recibido',
      'Revisión de la carrera',
      'Activación de cuenta',
    ]);
  });

  it.each(EXPECTED_STATES)(
    'marca las etapas completadas y la actual para el estado %s',
    (status, expectedStates) => {
      const request = buildRequest(status);
      const { result } = renderHook(() => useRequestTimeline(request));

      expect(result.current.map((stage) => stage.state)).toEqual(expectedStates);
    },
  );

  it('formatea la fecha y hora de la solicitud enviada', () => {
    const request = buildRequest('IN_REVIEW');
    const { result } = renderHook(() => useRequestTimeline(request));

    expect(result.current[0].occurredAtLabel).toMatch(/03\/10\/2026.*14:35/);
  });

  it('deja la etiqueta de fecha en null cuando la fecha falta o es inválida', () => {
    const request = buildRequest('IN_REVIEW', { submittedAt: 'fecha-invalida' });
    const { result } = renderHook(() => useRequestTimeline(request));

    expect(result.current[0].occurredAtLabel).toBeNull();
    expect(result.current[3].occurredAtLabel).toBeNull();
  });

  it('define el texto en español de los estados', () => {
    expect(STATUS_LABELS.IN_REVIEW).toBe('En revisión');
    expect(STATUS_LABELS.REJECTED).toBe('Rechazada');
  });
});
