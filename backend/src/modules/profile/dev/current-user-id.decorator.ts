import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';

// Temporary identity source until the auth module (JWT) is available.
// The client sends the logged user id in this header.
export const USER_ID_HEADER = 'x-user-id';

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
}

export function extractUserId(request: RequestWithHeaders): string {
  const rawValue = request.headers[USER_ID_HEADER];
  const userId = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  if (!userId || !z.uuid().safeParse(userId).success) {
    throw new UnauthorizedException('Debes iniciar sesión para continuar.');
  }

  return userId;
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    extractUserId(context.switchToHttp().getRequest<RequestWithHeaders>()),
);
