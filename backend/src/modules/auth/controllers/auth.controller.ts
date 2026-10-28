import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { LoginDto } from '../requests/login.schema.js';
import { RequestPasswordResetDto } from '../requests/request-password-reset.schema.js';
import { VerifyPasswordResetDto } from '../requests/verify-password-reset.schema.js';
import { ResetPasswordDto } from '../requests/reset-password.schema.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('session')
  @UseGuards(JwtAuthGuard)
  getSession(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSession(user);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
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
