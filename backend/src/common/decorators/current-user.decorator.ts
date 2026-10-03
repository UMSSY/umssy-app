import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './roles.decorator.js';

export const getCurrentUser = (
  _data: unknown,
  context: ExecutionContext,
): AuthenticatedUser => {
  return context.switchToHttp().getRequest().user;
};

export const CurrentUser = createParamDecorator(getCurrentUser);
