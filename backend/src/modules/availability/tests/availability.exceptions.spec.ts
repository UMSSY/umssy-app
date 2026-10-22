import { describe, expect, it } from 'vitest';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import {
  BlockHasAppointmentException,
  BlockNotFoundException,
  BlockNotOwnedException,
  BlockOverlapException,
  BlockedDateHasAppointmentException,
  BlockedDateInPastException,
  BlockedDateNotFoundException,
  BlockedDateNotOwnedException,
  DayBlockedException,
  InvalidBlockTimeException,
  MentorAvailabilityNotOwnedException,
} from '../exceptions/index.js';

describe('availability exceptions', () => {
  it.each([
    [new BlockOverlapException(), 409],
    [new BlockNotFoundException(), 404],
    [new BlockNotOwnedException(), 403],
    [new BlockHasAppointmentException(), 409],
    [new InvalidBlockTimeException(), 400],
    [new MentorAvailabilityNotOwnedException(), 403],
    [new BlockedDateHasAppointmentException(), 409],
    [new BlockedDateInPastException(), 400],
    [new BlockedDateNotFoundException(), 404],
    [new BlockedDateNotOwnedException(), 403],
    [new DayBlockedException(), 409],
  ])('%o usa el status esperado', (exception, statusCode) => {
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.statusCode).toBe(statusCode);
  });

  it.each([
    [new BlockedDateHasAppointmentException(), 'No puedes bloquear un día con citas confirmadas'],
    [new BlockedDateInPastException(), 'No se pueden bloquear fechas pasadas'],
    [new DayBlockedException(), 'Ese día está bloqueado'],
  ])('%o usa el mensaje de la HU-08', (exception, message) => {
    expect(exception.message).toBe(message);
  });
});
