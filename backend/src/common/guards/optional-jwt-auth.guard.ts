
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { BEARER_PREFIX } from '../constants/auth.constants.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.types.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers?.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith(BEARER_PREFIX)
    ) {
      return true;
    }

    try {
      return await this.jwtAuthGuard.canActivate(context);
    } catch {
      return true;
    }
  }
}
