import { describe, expect, it } from 'vitest';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import {
  BlockHasAppointmentException,
  BlockNotFoundException,
  BlockNotOwnedException,
  BlockOverlapException,
  InvalidBlockTimeException,
  MentorNotFoundException,
} from '../exceptions/index.js';

describe('availability exceptions', () => {
  it.each([
    [new BlockOverlapException(), 409],
    [new BlockNotFoundException(), 404],
    [new BlockNotOwnedException(), 403],
    [new BlockHasAppointmentException(), 409],
    [new InvalidBlockTimeException(), 400],
    [new MentorNotFoundException(), 404],
  ])('%o usa el status esperado', (exception, statusCode) => {
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.statusCode).toBe(statusCode);
  });
});
