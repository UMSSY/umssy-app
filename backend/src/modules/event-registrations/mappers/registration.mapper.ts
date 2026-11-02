import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { InternalException } from '../../../common/exceptions/internal.exception.js';
import type { RegistrationRecord } from '../types/registration-record.types.js';
import type { RegistrationResponse } from '../types/registration-response.types.js';

export function mapRegistration(record: RegistrationRecord): RegistrationResponse {
  const status = record.status.title === REGISTRATION_STATUS_TITLES.confirmed
    ? 'confirmed'
    : record.status.title === REGISTRATION_STATUS_TITLES.cancelled
      ? 'cancelled'
      : null;
  if (status === null || (status === 'confirmed') !== (record.cancelledAt === null)) {
    throw new InternalException();
  }
  return {
    id: record.id,
    eventId: record.eventId,
    status,
    qrToken: record.qrToken,
    registeredAt: record.registeredAt.toISOString(),
    cancelledAt: record.cancelledAt?.toISOString() ?? null,
  };
}
