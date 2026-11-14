import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.types.js';
import { extractAccessToken } from '../utils/extract-access-token.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!extractAccessToken(request)) {
      return true;
    }

    try {
      return await this.jwtAuthGuard.canActivate(context);
    } catch {
      return true;
    }
  }
}
