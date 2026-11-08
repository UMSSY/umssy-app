import { RECORD_NOT_FOUND_CODE } from '../constants/prisma-errors.constants.js';
import { Prisma } from '../../prisma/client.js';


export function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND_CODE
  );
}

export async function mapRecordNotFound<T>(
  operation: Promise<T>,
  createException: () => Error,
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw createException();
    }
    throw error;
  }
}
