import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../services/session.service.js';
import { ROLE_NAMES } from '../enums/roles.enum.js';
import { SAFE_HTTP_METHODS } from '../constants/auth.constants.js';
import { MissingUserException } from '../exceptions/missing-user.exception.js';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.types.js';
import type { LoginJwtPayload } from '../types/login-jwt-payload.types.js';
import { parseCorsOrigins } from '../utils/cors-origins.js';
import { extractAccessToken } from '../utils/extract-access-token.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const extracted = extractAccessToken(request);

    if (!extracted) {
      throw new MissingUserException();
    }

    if (
      extracted.source === 'cookie' &&
      !this.isTrustedCookieRequest(request)
    ) {
      throw new UnauthorizedSessionException();
    }

    let payload: LoginJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<LoginJwtPayload>(
        extracted.token,
      );
    } catch {
      throw new UnauthorizedSessionException();
    }

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim() ||
      typeof payload.roleTag !== 'string' ||
      !payload.roleTag.trim() ||
      (payload.roles !== undefined &&
        (!Array.isArray(payload.roles) ||
          payload.roles.length === 0 ||
          payload.roles.some(
            (role) => !ROLE_NAMES.some((knownRole) => knownRole === role),
          )))
    ) {
      throw new UnauthorizedSessionException();
    }

    request.user = await this.sessionService.getAuthenticatedUser(payload.sub);

    return true;
  }

  private isTrustedCookieRequest(request: AuthenticatedRequest): boolean {
    const method = request.method?.toUpperCase() ?? 'GET';
    if (SAFE_HTTP_METHODS.some((safeMethod) => safeMethod === method)) {
      return true;
    }
    const origin = request.headers?.origin;
    return typeof origin === 'string' && parseCorsOrigins().includes(origin);
  }
}
