import { describe, expect, it } from 'vitest';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { appointmentIdSchema } from '../requests/appointment-id.request.js';
import { myAppointmentsQuerySchema } from '../requests/my-appointments-query.request.js';
import { APPOINTMENT_ID } from './fixtures/appointment-record.fixture.js';

describe('My appointments request validation', () => {
  const queryPipe = new RequestValidationPipe(myAppointmentsQuerySchema);
  const idPipe = new RequestValidationPipe(appointmentIdSchema);

  it('uses upcoming when the scope is omitted', () => {
    expect(queryPipe.transform({})).toEqual({ scope: 'upcoming' });
  });

  it.each(['upcoming', 'past'])('accepts scope=%s', (scope) => {
    expect(queryPipe.transform({ scope })).toEqual({ scope });
  });

  it.each(['', 'future', 'UPCOMING', null, 1, ['upcoming', 'past']])(
    'rejects an invalid scope: %j',
    (scope) => {
      expect(() => queryPipe.transform({ scope })).toThrow(
        RequestValidationException,
      );
    },
  );

  it.each(['userId', 'mentorId', 'studentId', 'limit'])(
    'rejects the unknown query key %s',
    (key) => {
      expect(() => queryPipe.transform({ [key]: 'other-user' })).toThrow(
        RequestValidationException,
      );
    },
  );

  it('accepts a valid appointment UUID', () => {
    expect(idPipe.transform(APPOINTMENT_ID)).toBe(APPOINTMENT_ID);
  });

  it.each(['not-a-uuid', 'me', '', null, ['id']])(
    'rejects an invalid appointment id: %j',
    (id) => {
      expect(() => idPipe.transform(id)).toThrow(RequestValidationException);
    },
  );
});
