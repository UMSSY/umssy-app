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
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
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
} from '../../../common/utils/refresh-token-cookie.js';
import { LoginDto } from '../requests/login.schema.js';
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
  ) {}

  @Get('session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSession(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSession(user);
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
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
      return { roleTag: session.roleTag, roles: session.roles };
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
  requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Post('forgot-password/verify')
  verifyPasswordReset(@Body() body: VerifyPasswordResetDto) {
    return this.authService.verifyPasswordReset(body);
  }

  @Post('forgot-password/reset')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
