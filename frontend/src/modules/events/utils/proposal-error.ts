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
    const messages: Record<number, string> = {
      400: 'Revisa los datos de la propuesta e inténtalo nuevamente.',
      401: 'Tu sesión venció. Inicia sesión nuevamente para enviar la propuesta.',
      403: 'Tu cuenta no tiene permiso para proponer talleres.',
      404: 'El servicio de propuestas no está disponible. Tus datos se conservan en este formulario.',
      409: 'No se pudo completar la operación. Revisa la propuesta e inténtalo nuevamente.',
      413: 'La portada supera el tamaño admitido por el servidor.',
      422: 'Revisa los campos indicados antes de enviar.',
    };
    return { fields, message: messages[status ?? 0] ?? 'No se pudo confirmar el envío. Tus datos se conservan; puedes reintentar.' };
  }
  return { fields, message: 'No se pudo verificar el registro. Tus datos se conservan; puedes reintentar.' };
}
