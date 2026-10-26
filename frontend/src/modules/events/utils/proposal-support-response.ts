import type { ProposalSupportResponse } from '../types/proposal-support-response.types';
import {
  readBoolean,
  readCount,
  readNullableCount,
  readRecord,
  readString,
} from './response-validation';

export function parseProposalSupportResponse(
  value: unknown,
  requestedEventId: string,
): ProposalSupportResponse {
  const body = readRecord(value);
  if (body.ok !== true || body.statusCode !== 201) {
    throw new Error('La respuesta del backend no es válida.');
  }

  const data = readRecord(body.data);
  const eventId = readString(data.eventId);
  const status = readString(data.status);
  const progressPercent = readCount(data.progressPercent);
  const hasSupported = readBoolean(data.hasSupported);

  if (
    eventId !== requestedEventId ||
    (status !== 'voting' && status !== 'Publicado') ||
    progressPercent > 100 ||
    !hasSupported
  ) {
    throw new Error('La respuesta del backend no es válida.');
  }

  return {
    eventId,
    status,
    supportCount: readCount(data.supportCount),
    supportThreshold: readNullableCount(data.supportThreshold),
    supportsRemaining: readCount(data.supportsRemaining),
    progressPercent,
    hasSupported: true,
  };
}
