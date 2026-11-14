import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { SessionService } from '../../../common/services/session.service.js';
import { UnauthorizedSessionException } from '../../../common/exceptions/unauthorized-session.exception.js';
import {
  REFRESH_REVOCATION_REASONS,
  type RefreshRevocationReason,
} from '../constants/refresh-token.constants.js';
import {
  SESSION_IDLE_MS,
  SESSION_MAX_MS,
} from '../constants/session.constants.js';
import {
  PasswordChangedException,
  RefreshInvalidException,
  SessionExpiredException,
  SessionRevokedException,
} from '../exceptions/index.js';
import {
  RefreshTokenRepository,
  type NewRefreshToken,
} from '../repositories/refresh-token.repository.js';
import {
  computeSlidingExpiry,
  evaluateRefreshToken,
} from '../utils/evaluate-refresh-token.js';
import {
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/refresh-token.util.js';

export interface IssuedRefreshToken {
  refreshToken: string;
  refreshMaxAgeMs: number;
}

export interface RotatedSession extends IssuedRefreshToken {
  accessToken: string;
  accessMaxAgeMs: number;
  roleTag: string;
  roles: string[];
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  // Starts a new token family right after a successful login.
  async startFromLogin(
    accessToken: string,
    userAgent?: string,
  ): Promise<IssuedRefreshToken> {
    const payload = this.jwtService.decode<{
      sub?: unknown;
      roleTag?: unknown;
    } | null>(accessToken);
    if (typeof payload?.sub !== 'string' || typeof payload.roleTag !== 'string') {
      throw new UnauthorizedSessionException();
    }

    const now = new Date();
    return this.persist(
      {
        userId: payload.sub,
        familyId: randomUUID(),
        roleTag: payload.roleTag,
        absoluteExpiresAt: new Date(now.getTime() + SESSION_MAX_MS),
        userAgent,
      },
      now,
    );
  }

  async rotate(
    rawToken: string | undefined,
    userAgent?: string,
  ): Promise<RotatedSession> {
    if (!rawToken) throw new RefreshInvalidException();

    const current = await this.refreshTokens.findByHash(
      hashRefreshToken(rawToken),
    );
    if (!current) throw new RefreshInvalidException();

    const now = new Date();
    const verdict = evaluateRefreshToken(current, now);
    if (verdict.outcome === 'revoked') {
      throw verdict.code === 'PASSWORD_CHANGED'
        ? new PasswordChangedException()
        : new SessionRevokedException();
    }
    if (verdict.outcome === 'reuse') {
      await this.revokeFamily(current.familyId, 'reuseDetected');
      throw new SessionRevokedException();
    }
    if (verdict.outcome === 'expired') throw new SessionExpiredException();

    const user = await this.sessionService
      .getAuthenticatedUser(current.userId)
      .catch(async () => {
        await this.revokeFamily(current.familyId, 'userInactive');
        throw new SessionRevokedException();
      });
    if (!user.roles.includes(current.roleTag)) {
      await this.revokeFamily(current.familyId, 'roleRemoved');
      throw new SessionRevokedException();
    }

    const next = this.buildNextToken(
      {
        userId: current.userId,
        familyId: current.familyId,
        roleTag: current.roleTag,
        absoluteExpiresAt: current.absoluteExpiresAt,
        userAgent,
      },
      now,
    );
    const rotated = await this.refreshTokens.rotate(current.id, next.data);
    if (!rotated) {
      await this.revokeFamily(current.familyId, 'reuseDetected');
      throw new SessionRevokedException();
    }

    const accessTtlSeconds = Math.max(
      1,
      Math.floor(
        Math.min(
          SESSION_IDLE_MS,
          current.absoluteExpiresAt.getTime() - now.getTime(),
        ) / 1000,
      ),
    );
    const accessToken = this.jwtService.sign(
      { sub: user.id, roleTag: current.roleTag, roles: user.roles },
      { expiresIn: accessTtlSeconds },
    );

    return {
      accessToken,
      accessMaxAgeMs: accessTtlSeconds * 1000,
      refreshToken: next.token,
      refreshMaxAgeMs: next.maxAgeMs,
      roleTag: current.roleTag,
      roles: user.roles,
    };
  }

  // Logout: kills the whole family so the cookie cannot be used again.
  async revokeByToken(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const current = await this.refreshTokens.findByHash(
      hashRefreshToken(rawToken),
    );
    if (current) await this.revokeFamily(current.familyId, 'logout');
  }

  private async persist(
    base: Omit<NewRefreshToken, 'tokenHash' | 'expiresAt' | 'userAgent'> & {
      userAgent?: string;
    },
    now: Date,
  ): Promise<IssuedRefreshToken> {
    const next = this.buildNextToken(base, now);
    await this.refreshTokens.create(next.data);
    return { refreshToken: next.token, refreshMaxAgeMs: next.maxAgeMs };
  }

  private buildNextToken(
    base: Omit<NewRefreshToken, 'tokenHash' | 'expiresAt' | 'userAgent'> & {
      userAgent?: string;
    },
    now: Date,
  ): { token: string; maxAgeMs: number; data: NewRefreshToken } {
    const { token, tokenHash } = generateRefreshToken();
    const expiresAt = computeSlidingExpiry(
      now,
      base.absoluteExpiresAt,
      SESSION_IDLE_MS,
    );
    return {
      token,
      maxAgeMs: expiresAt.getTime() - now.getTime(),
      data: {
        ...base,
        tokenHash,
        expiresAt,
        userAgent: base.userAgent?.slice(0, 255) ?? null,
      },
    };
  }

  private revokeFamily(
    familyId: string,
    reason: keyof typeof REFRESH_REVOCATION_REASONS,
  ) {
    const value: RefreshRevocationReason = REFRESH_REVOCATION_REASONS[reason];
    return this.refreshTokens.revokeFamily(familyId, value);
  }

  revokeAllForUser(userId: string) {
    return this.refreshTokens.revokeAllForUser(
      userId,
      REFRESH_REVOCATION_REASONS.passwordChanged,
    );
  }
}