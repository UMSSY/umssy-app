import { describe, expect, it } from 'vitest';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { appointmentIdSchema } from '../requests/appointment-id.request.js';
import { myAppointmentsQuerySchema } from '../requests/my-appointments-query.request.js';
import { APPOINTMENT_ID } from './fixtures/appointment-record.fixture.js';

describe('My appointments request validation', () => {
  const queryPipe = new RequestValidationPipe(myAppointmentsQuerySchema);
  const idPipe = new RequestValidationPipe(appointmentIdSchema);

  it('uses upcoming and the first page of ten when nothing is sent', () => {
    expect(queryPipe.transform({})).toEqual({
      scope: 'upcoming',
      page: 1,
      pageSize: 10,
    });
  });

  it.each(['upcoming', 'past'])('accepts scope=%s', (scope) => {
    expect(queryPipe.transform({ scope })).toEqual({
      scope,
      page: 1,
      pageSize: 10,
    });
  });

  it('reads page and pageSize as numbers from the query string', () => {
    expect(queryPipe.transform({ page: '3', pageSize: '25' })).toEqual({
      scope: 'upcoming',
      page: 3,
      pageSize: 25,
    });
  });

  it('accepts the maximum page size', () => {
    expect(queryPipe.transform({ pageSize: '50' }).pageSize).toBe(50);
  });

  it.each(['0', '-1', '1.5', 'two', ''])(
    'rejects the invalid page %j',
    (page) => {
      expect(() => queryPipe.transform({ page })).toThrow(
        RequestValidationException,
      );
    },
  );

  it.each(['0', '-5', '51', '100', '10.5', 'ten', ''])(
    'rejects the invalid page size %j',
    (pageSize) => {
      expect(() => queryPipe.transform({ pageSize })).toThrow(
        RequestValidationException,
      );
    },
  );

  it.each(['', 'future', 'UPCOMING', null, 1, ['upcoming', 'past']])(
    'rejects an invalid scope: %j',
    (scope) => {
      expect(() => queryPipe.transform({ scope })).toThrow(
        RequestValidationException,
      );
    },
  );

  it('trims the search text', () => {
    expect(queryPipe.transform({ q: '  María López  ' }).q).toBe(
      'María López',
    );
  });

  it('ignores a search made only of spaces', () => {
    expect(queryPipe.transform({ q: '   ' }).q).toBeUndefined();
  });

  it('accepts a search of exactly 100 characters after trimming', () => {
    const q = 'a'.repeat(100);
    expect(queryPipe.transform({ q: `  ${q}  ` }).q).toBe(q);
  });

  it.each(['a'.repeat(101), ['ana', 'luis'], 5])(
    'rejects the invalid search %j',
    (q) => {
      expect(() => queryPipe.transform({ q })).toThrow(
        RequestValidationException,
      );
    },
  );

  it.each(['userId', 'mentorId', 'studentId', 'limit', 'offset'])(
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
