import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { loginSchema } from '../requests/login.schema.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: ReturnType<typeof loginSchema.parse>) {
    return this.authService.login(body);
  }
}