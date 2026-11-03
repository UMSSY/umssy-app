import { Prisma } from '../../../prisma/client.js';

export function isRegistrationTransactionConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return ['P2034', 'P2002'].includes(error.code);
  return error instanceof Error && error.name === 'DriverAdapterError'
    && typeof error.cause === 'object' && error.cause !== null
    && 'kind' in error.cause && error.cause.kind === 'TransactionWriteConflict';
}
