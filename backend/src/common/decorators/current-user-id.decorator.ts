import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { MissingUserException } from '../exceptions/missing-user.exception.js';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'];

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new MissingUserException();
    }

    return userId;
  },
);
