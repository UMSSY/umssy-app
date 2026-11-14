import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ACCESS_TOKEN_COOKIE } from '../../../common/constants/auth.constants.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  buildAccessTokenCookieOptions,
  buildClearAccessTokenCookieOptions,
} from '../../../common/utils/access-token-cookie.js';
import { LoginDto } from '../requests/login.schema.js';
import { RequestPasswordResetDto } from '../requests/request-password-reset.schema.js';
import { VerifyPasswordResetDto } from '../requests/verify-password-reset.schema.js';
import { ResetPasswordDto } from '../requests/reset-password.schema.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  ) {
    const result = await this.authService.login(body);
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      buildAccessTokenCookieOptions(
        this.authService.getAccessTokenMaxAgeMs(result.accessToken),
      ),
    );
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      buildClearAccessTokenCookieOptions(),
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
