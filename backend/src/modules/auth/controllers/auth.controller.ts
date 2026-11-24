import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CREDENTIAL_LIMIT_RESPONSE } from '../constants/credential-limit-response.constants.js';
import { CredentialLimitsService } from '../services/credential-limits.service.js';
import { AuthService } from '../services/auth.service.js';
import { RefreshTokenService } from '../services/refresh-token.service.js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../../common/constants/auth.constants.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  buildAccessTokenCookieOptions,
  buildClearAccessTokenCookieOptions,
} from '../../../common/utils/access-token-cookie.js';
import {
  buildClearRefreshTokenCookieOptions,
  buildRefreshTokenCookieOptions,
} from '../utils/refresh-token-cookie.util.js';
import { LoginDto } from '../requests/login.schema.js';
import { GoogleLoginDto } from '../requests/google-login.schema.js';
import { GoogleLinkDto } from '../requests/google-link.schema.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import {
  InvalidCredentialsException,
  MissingGoogleCredentialException,
} from '../exceptions/index.js';
import { RequestPasswordResetDto } from '../requests/request-password-reset.schema.js';
import { VerifyPasswordResetDto } from '../requests/verify-password-reset.schema.js';
import { ResetPasswordDto } from '../requests/reset-password.schema.js';

function readRefreshCookie(request?: Request): string | undefined {
  const value: unknown = request?.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly credentialLimits: CredentialLimitsService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Get('session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request?: Request,
  ) {
    const absoluteExpiresAt = await this.refreshTokens.getAbsoluteExpiry(
      readRefreshCookie(request),
    );
    return this.authService.getSession(user, absoluteExpiresAt);
  }

  @Post('login')
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.credentialLimits.run('login', body.email, async () => {
      const result = await this.authService.login(body);
      response.cookie(
        ACCESS_TOKEN_COOKIE,
        result.accessToken,
        buildAccessTokenCookieOptions(
          this.authService.getAccessTokenMaxAgeMs(result.accessToken),
        ),
      );
      const refresh = await this.refreshTokens.startFromLogin(
        result.accessToken,
        userAgent,
      );
      response.cookie(
        REFRESH_TOKEN_COOKIE,
        refresh.refreshToken,
        buildRefreshTokenCookieOptions(refresh.refreshMaxAgeMs),
      );
      return result;
    });
  }

  @Post('google/login')
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  async googleLogin(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const token = body.credential ?? body.idToken;
    if (!token) {
      throw new InvalidCredentialsException(
        'Credencial de Google no proporcionada.',
      );
    }

    const verifiedUser = await this.googleAuthService.verifyCredential(token);

    return this.credentialLimits.run('login', verifiedUser.email, async () => {
      const result = await this.authService.loginWithGoogle(
        verifiedUser,
        body.roleTag,
      );

      response.cookie(
        ACCESS_TOKEN_COOKIE,
        result.accessToken,
        buildAccessTokenCookieOptions(
          this.authService.getAccessTokenMaxAgeMs(result.accessToken),
        ),
      );

      const refresh = await this.refreshTokens.startFromLogin(
        result.accessToken,
        userAgent,
      );

      response.cookie(
        REFRESH_TOKEN_COOKIE,
        refresh.refreshToken,
        buildRefreshTokenCookieOptions(refresh.refreshMaxAgeMs),
      );

      return result;
    });
  }

  @Post('google/link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async googleLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GoogleLinkDto,
  ) {
    const token = body.credential ?? body.idToken;
    if (!token) {
      throw new MissingGoogleCredentialException();
    }

    const verifiedGoogle = await this.googleAuthService.verifyCredential(token);

    return this.authService.linkGoogle(user, verifiedGoogle);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Res({ passthrough: true }) response: Response,
    @Req() request?: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    try {
      const session = await this.refreshTokens.rotate(
        readRefreshCookie(request),
        userAgent,
      );
      response.cookie(
        ACCESS_TOKEN_COOKIE,
        session.accessToken,
        buildAccessTokenCookieOptions(session.accessMaxAgeMs),
      );
      response.cookie(
        REFRESH_TOKEN_COOKIE,
        session.refreshToken,
        buildRefreshTokenCookieOptions(session.refreshMaxAgeMs),
      );
      return {
        accessToken: session.accessToken,
        roleTag: session.roleTag,
        roles: session.roles,
      };
    } catch (error) {
      if (error instanceof DomainException && error.statusCode === 401) {
        response.clearCookie(
          ACCESS_TOKEN_COOKIE,
          buildClearAccessTokenCookieOptions(),
        );
        response.clearCookie(
          REFRESH_TOKEN_COOKIE,
          buildClearRefreshTokenCookieOptions(),
        );
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() request?: Request,
  ): Promise<void> {
    await this.refreshTokens.revokeByToken(readRefreshCookie(request));
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      buildClearAccessTokenCookieOptions(),
    );
    response.clearCookie(
      REFRESH_TOKEN_COOKIE,
      buildClearRefreshTokenCookieOptions(),
    );
  }

  @Post('forgot-password/request')
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.credentialLimits.run('request', body.email, () =>
      this.authService.requestPasswordReset(body),
    );
  }

  @Post('forgot-password/verify')
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  verifyPasswordReset(@Body() body: VerifyPasswordResetDto) {
    return this.credentialLimits.run('verify', body.email, () =>
      this.authService.verifyPasswordReset(body),
    );
  }

  @Post('forgot-password/reset')
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  @ApiResponse({
    status: 400,
    description: 'Código no válido o contraseña reutilizada (PASSWORD_REUSED).',
  })
  @ApiResponse({
    status: 409,
    description: 'Otro cambio de contraseña invalidó la comprobación (PASSWORD_RESET_CONFLICT).',
  })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.credentialLimits.run('reset', body.email, () =>
      this.authService.resetPassword(body),
    );
  }
}
