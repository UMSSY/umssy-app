import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
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

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
