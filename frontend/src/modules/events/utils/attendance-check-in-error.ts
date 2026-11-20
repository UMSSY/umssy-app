import { isApiError } from '@/shared/services/api-client';
import type { AttendancePanelState } from '../types/attendance-panel-state.types';
import { AttendanceSessionRequiredError } from './attendance-session-required.error';

function errorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('code' in body)) return null;
  return typeof body.code === 'string' ? body.code : null;
}

export function getAttendanceCheckInError(
  error: unknown,
): Extract<AttendancePanelState, { kind: 'invalid' | 'error' }> {
  if (error instanceof AttendanceSessionRequiredError) {
    return {
      kind: 'error',
      message: 'Inicia sesión con la cuenta que creó el taller.',
    };
  }
  if (!isApiError(error)) {
    return {
      kind: 'error',
      message: 'No se pudo verificar la entrada. Inténtalo nuevamente.',
    };
  }

  const status = error.response?.status;
  const code = errorCode(error.response?.data);
  if (status === 422 && code === 'ATTENDANCE_PASS_CANCELLED') {
    return {
      kind: 'invalid',
      message: 'Pase inválido - Inscripción cancelada. Solicita un pase vigente.',
    };
  }
  if (status === 422 && code === 'ATTENDANCE_PASS_INVALID') {
    return {
      kind: 'invalid',
      message: 'Este pase no corresponde al taller o ya no está vigente.',
    };
  }
  if (status === 422 && code === 'ATTENDANCE_SESSION_INVALID') {
    return {
      kind: 'invalid',
      message: 'La sesión elegida no pertenece a este taller.',
    };
  }
  if (status === 400 && code === 'VALIDATION_ERROR') {
    return {
      kind: 'invalid',
      message:
        'Formato de pase no reconocido. Revisa la referencia e inténtalo de nuevo.',
    };
  }
  if (status === 401) {
    return {
      kind: 'error',
      message: 'Tu sesión venció. Inicia sesión nuevamente.',
    };
  }
  if (status === 403) {
    return {
      kind: 'error',
      message: 'No tienes permiso para registrar asistencias de este taller.',
    };
  }
  if (status === 409 && code === 'ATTENDANCE_OUTSIDE_WINDOW') {
    return {
      kind: 'error',
      message: 'Fuera de la ventana horaria de validación. El escaneo solo está disponible durante el horario del taller.',
    };
  }
  if (!status) {
    return {
      kind: 'error',
      message: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
    };
  }
  return {
    kind: 'error',
    message: 'No se pudo verificar la entrada. Inténtalo nuevamente.',
  };
}
