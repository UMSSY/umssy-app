import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { LoginDto } from '../requests/login.schema.js';
import { RegisterDto } from '../requests/register.schema.js';
import { RegistrationService } from '../services/registration.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.registrationService.register(body);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  getSession(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSession(user);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
