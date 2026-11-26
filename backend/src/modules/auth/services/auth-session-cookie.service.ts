import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { RefreshTokenService } from './refresh-token.service.js';
import { writeSessionCookies } from '../utils/session-cookies.util.js';

@Injectable()
export class AuthSessionCookieService {
  constructor(private readonly refreshTokens: RefreshTokenService) {}

  async issueLoginCookies(
    response: Pick<Response, 'cookie'>,
    accessToken: string,
    userAgent?: string,
  ): Promise<string> {
    const session = await this.refreshTokens.startFromLogin(
      accessToken,
      userAgent,
    );
    writeSessionCookies(response, session);
    return session.accessToken;
  }
}
