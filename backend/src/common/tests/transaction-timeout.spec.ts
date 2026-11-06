import { describe, expect, it } from 'vitest';
import { Prisma } from '../../prisma/client.js';
import { isTransactionTimeoutError } from '../utils/transaction-timeout.js';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('isTransactionTimeoutError', () => {
  it('reconoce la transacción que venció o no pudo empezar a tiempo (P2028)', () => {
    expect(isTransactionTimeoutError(prismaError('P2028'))).toBe(true);
  });

  it.each([[prismaError('P2025')], [new Error('P2028')], [null]])('ignora otros errores: %o', (error) => {
    expect(isTransactionTimeoutError(error)).toBe(false);
  });
});
