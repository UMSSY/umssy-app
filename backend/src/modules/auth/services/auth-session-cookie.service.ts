import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RefreshTokenService } from './refresh-token.service.js';
import { writeSessionCookies } from '../utils/session-cookies.util.js';

@Injectable()
export class AuthSessionCookieService {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async issueLoginCookies(
    response: Pick<Response, 'cookie'>,
    accessToken: string,
    userAgent?: string,
  ): Promise<void> {
    const refresh = await this.refreshTokens.startFromLogin(
      accessToken,
      userAgent,
    );
    writeSessionCookies(response, {
      accessToken,
      accessMaxAgeMs: this.authService.getAccessTokenMaxAgeMs(accessToken),
      refreshToken: refresh.refreshToken,
      refreshMaxAgeMs: refresh.refreshMaxAgeMs,
    });
  }
}
