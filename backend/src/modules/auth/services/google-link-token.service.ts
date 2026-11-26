import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  GOOGLE_LINK_PURPOSE,
  GOOGLE_LINK_TOKEN_TTL_SECONDS,
} from '../constants/google-link.constants.js';
import {
  GoogleLinkTokenExpiredException,
  GoogleLinkTokenInvalidException,
} from '../exceptions/index.js';
import type {
  GoogleLinkClaims,
  GoogleLinkTokenPayload,
} from '../types/google-link-claims.types.js';

@Injectable()
export class GoogleLinkTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(claims: GoogleLinkClaims): string {
    return this.jwtService.sign(
      { ...claims, purpose: GOOGLE_LINK_PURPOSE },
      { expiresIn: GOOGLE_LINK_TOKEN_TTL_SECONDS },
    );
  }

  verify(token: string): GoogleLinkClaims {
    let payload: Partial<GoogleLinkTokenPayload> | null;
    try {
      payload = this.jwtService.verify<Partial<GoogleLinkTokenPayload>>(token);
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new GoogleLinkTokenExpiredException();
      }
      throw new GoogleLinkTokenInvalidException();
    }

    if (
      !payload ||
      payload.purpose !== GOOGLE_LINK_PURPOSE ||
      !this.isFilled(payload.userId) ||
      !this.isFilled(payload.googleSub) ||
      !this.isFilled(payload.email)
    ) {
      throw new GoogleLinkTokenInvalidException();
    }

    return {
      userId: payload.userId,
      googleSub: payload.googleSub,
      email: payload.email,
      ...(typeof payload.picture === 'string' && { picture: payload.picture }),
    };
  }

  private isFilled(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
