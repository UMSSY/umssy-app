import { isApiError } from '@/shared/services/api-client';
import type { ProposalError } from '../types/proposal-error.types';

export function getProposalError(error: unknown): ProposalError {
  const fields: ProposalError['fields'] = {};
  if (isApiError(error)) {
    const status = error.response?.status;
    const body: unknown = error.response?.data;
    if (body && typeof body === 'object' && 'errors' in body && body.errors && typeof body.errors === 'object') {
      const errors = body.errors;
      for (const key of ['title', 'description', 'categoryId', 'eventDate', 'startTime', 'endTime', 'capacity', 'modality', 'location', 'cover'] as const) {
        const value: unknown = Array.isArray(errors)
          ? errors.find((error: unknown) => error !== null && typeof error === 'object' && 'field' in error && error.field === key)
          : (errors as Record<string, unknown>)[key];
        if (typeof value === 'string') fields[key] = value;
        else if (value !== null && typeof value === 'object' && 'message' in value && typeof value.message === 'string') fields[key] = value.message;
      }
    }
    const code = body && typeof body === 'object' && 'code' in body ? String(body.code) : '';
    const coverMessages: Record<string, string> = {
      EMPTY_FILE: 'Selecciona una imagen que no esté vacía.',
      INVALID_FILE_TYPE: 'Selecciona una imagen JPG o PNG.',
      CORRUPTED_FILE: 'La imagen está dañada. Selecciona otra.',
      FILE_TOO_LARGE: 'Selecciona una imagen de hasta 2 MB.',
    };
    if (coverMessages[code] || status === 413) fields.cover = coverMessages[code] ?? 'Selecciona una imagen de hasta 2 MB.';
    if (Object.keys(fields).length) return { fields, message: 'Corrige los campos indicados.' };
    if (!status) return { fields, message: 'No pudimos confirmar el envío. Revisa tu conexión y reintenta.' };
    const messages: Record<number, string> = {
      400: 'Revisa los datos de la propuesta e inténtalo nuevamente.',
      401: 'Tu sesión venció. Vuelve a iniciar sesión.',
      403: 'Tu cuenta no tiene permiso para proponer talleres.',
      404: 'El servicio de propuestas no está disponible. Tus datos se conservan en este formulario.',
      409: 'La propuesta cambió. Vuelve a revisarla antes de enviar.',
      413: 'La portada debe pesar como máximo 2 MB.',
      422: 'Revisa los campos indicados antes de enviar.',
      429: 'Demasiados intentos. Espera un momento y reintenta.',
      500: 'El servidor tuvo un problema. Tus datos se conservan; reintenta.',
      502: 'El servicio no responde. Tus datos se conservan; reintenta.',
      503: 'El servicio no está disponible. Inténtalo más tarde.',
    };
    return { fields, message: messages[status ?? 0] ?? 'No se pudo confirmar el envío. Tus datos se conservan; puedes reintentar.' };
  }
  return { fields, message: 'No se pudo verificar el registro. Tus datos se conservan; puedes reintentar.' };
}
