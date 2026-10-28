import { Prisma } from '../../prisma/client.js';
import { TRANSACTION_TIMEOUT_CODE } from '../constants/prisma-errors.constants.js';

export const isTransactionTimeoutError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === TRANSACTION_TIMEOUT_CODE;
